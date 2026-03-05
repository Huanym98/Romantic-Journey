/**
 * DotMorph: Canvas "ink dots" text morph without fade/flip.
 * - Particles always exist (no global opacity fade).
 * - Switching text updates target point cloud; particles smoothly flow to new shape.
 * - Uses seeded sampling so the same text yields stable point ordering, minimizing "flash".
 */
(function(){
  function mulberry32(seed){
    let t = seed >>> 0;
    return function(){
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash32(str){
    // FNV-1a 32-bit
    let h = 0x811c9dc5;
    for (let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }
  function easeInOut(t){
    return t*t*(3-2*t);
  }

  class DotMorph {
    constructor(el, opts={}){
      this.el = el;
      this.opts = Object.assign({
        text: "浪漫之旅",
        width: 640,
        height: 140,
        // Visual
        color: "#111",
        bg: "transparent",
        dotRadius: 1.8,
        cluster: 1, // draw 1..cluster mini-dots per particle
        clusterSpread: 1.2,
        // Sampling / fidelity
        particleCount: 2200,
        supersample: 2.0, // render mask at higher resolution for smoother edges
        threshold: 30, // alpha threshold
        // Motion
        morphMs: 1500,
        holdMs: 2200,
        spring: 0.10,   // attraction to target
        damping: 0.78,  // velocity damping
        maxSpeed: 8.0,
        // Fonts (canvas CSS font strings)
        fontFamilyZh: `"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",system-ui,sans-serif`,
        fontFamilyEn: `system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji"`,
        fontWeight: 600,
        fontSize: 96,
        letterSpacing: 0, // currently unused in canvas text, kept for future
        // Layout
        align: "center",
        baseline: "middle",
        padding: 10,
        // Debug
        debug: false,
      }, opts);

      this.canvas = document.createElement("canvas");
      this.canvas.className = "dot-morph-canvas";
      this.ctx = this.canvas.getContext("2d", { alpha: true });
      this.el.innerHTML = "";
      this.el.appendChild(this.canvas);

      this._dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      this._resize(this.opts.width, this.opts.height);

      this._off = document.createElement("canvas");
      this._offCtx = this._off.getContext("2d", { willReadFrequently: true });

      this.particles = [];
      this._targetsA = null;
      this._targetsB = null;
      this._switchStart = null;
      this._nextSwitchAt = null;
      this._running = false;
      this._raf = null;

      this.setText(this.opts.text, { immediate: true });
    }

    _resize(w, h){
      this.w = w;
      this.h = h;
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.canvas.width = Math.floor(w * this._dpr);
      this.canvas.height = Math.floor(h * this._dpr);
      this.ctx.setTransform(this._dpr,0,0,this._dpr,0,0);
    }

    _pickFont(text){
      const hasCJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(text);
      const fam = hasCJK ? this.opts.fontFamilyZh : this.opts.fontFamilyEn;
      return `${this.opts.fontWeight} ${this.opts.fontSize}px ${fam}`;
    }

    _makePointCloud(text){
      const ss = this.opts.supersample;
      const pad = this.opts.padding;
      const ow = Math.max(1, Math.floor((this.w) * ss));
      const oh = Math.max(1, Math.floor((this.h) * ss));
      this._off.width = ow;
      this._off.height = oh;

      const octx = this._offCtx;
      octx.setTransform(1,0,0,1,0,0);
      octx.clearRect(0,0,ow,oh);
      octx.fillStyle = "rgba(0,0,0,0)";
      octx.fillRect(0,0,ow,oh);

      octx.fillStyle = "#000";
      octx.font = this._pickFont(text);
      octx.textAlign = this.opts.align;
      octx.textBaseline = this.opts.baseline;

      const x = ow/2;
      const y = oh/2;
      octx.fillText(text, x, y);

      const img = octx.getImageData(0,0,ow,oh);
      const data = img.data;

      // Collect eligible pixels
      const pts = [];
      for (let yy=0; yy<oh; yy++){
        for (let xx=0; xx<ow; xx++){
          const a = data[(yy*ow + xx)*4 + 3];
          if (a > this.opts.threshold) pts.push([xx, yy]);
        }
      }
      if (!pts.length){
        // fallback: center
        return new Array(this.opts.particleCount).fill(0).map(()=>({x:this.w/2,y:this.h/2}));
      }

      // Seeded random sampling so shapes are stable per text
      const seed = hash32(text + "|" + this.opts.fontSize + "|" + this.opts.fontWeight);
      const rand = mulberry32(seed);

      const N = this.opts.particleCount;
      const chosen = new Array(N);
      for (let i=0;i<N;i++){
        const idx = Math.floor(rand()*pts.length);
        const p = pts[idx];
        // jitter within pixel cell to avoid "grid" look
        const jx = (rand()-0.5)*0.9;
        const jy = (rand()-0.5)*0.9;
        chosen[i] = {
          x: (p[0] + jx)/ss,
          y: (p[1] + jy)/ss
        };
      }

      // Sort by x then y for stable mapping (reduces cross-overs)
      chosen.sort((a,b)=> (a.x-b.x) || (a.y-b.y));
      return chosen;
    }

    _ensureParticles(){
      const N = this.opts.particleCount;
      if (this.particles.length === N) return;
      const rand = mulberry32(hash32("init|" + this.opts.text));
      this.particles = new Array(N).fill(0).map(()=>({
        x: this.w/2 + (rand()-0.5)*40,
        y: this.h/2 + (rand()-0.5)*30,
        vx: 0, vy: 0,
      }));
    }

    setText(text, { immediate=false } = {}){
      this.opts.text = text;
      this._ensureParticles();

      const newTargets = this._makePointCloud(text);

      if (immediate || !this._targetsB){
        this._targetsA = newTargets;
        this._targetsB = newTargets;
        this._switchStart = performance.now();
        // snap particles gently to initial
        for (let i=0;i<this.particles.length;i++){
          this.particles[i].x = newTargets[i].x;
          this.particles[i].y = newTargets[i].y;
          this.particles[i].vx = 0; this.particles[i].vy = 0;
        }
      } else {
        this._targetsA = this._targetsB;
        this._targetsB = newTargets;
        this._switchStart = performance.now();
      }

      this._nextSwitchAt = (this._switchStart || performance.now()) + this.opts.morphMs + this.opts.holdMs;
    }

    start(sequence){
      this.sequence = sequence && sequence.length ? sequence.slice() : [this.opts.text];
      this._seqIndex = 0;
      this._running = true;
      this._tick();
    }

    stop(){
      this._running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
    }

    _drawDots(){
      const ctx = this.ctx;
      ctx.clearRect(0,0,this.w,this.h);
      // optional background
      if (this.opts.bg && this.opts.bg !== "transparent"){
        ctx.fillStyle = this.opts.bg;
        ctx.fillRect(0,0,this.w,this.h);
      }

      ctx.fillStyle = this.opts.color;
      const r = this.opts.dotRadius;
      const cluster = Math.max(1, this.opts.cluster|0);
      const spread = this.opts.clusterSpread;

      for (let i=0;i<this.particles.length;i++){
        const p = this.particles[i];
        // main dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI*2);
        ctx.fill();

        // small cluster dots around for "ink blob" feel
        for (let k=1;k<cluster;k++){
          const ang = (i*0.37 + k*2.1) % (Math.PI*2);
          const dx = Math.cos(ang) * (spread * (0.35 + (k/cluster)));
          const dy = Math.sin(ang) * (spread * (0.35 + (k/cluster)));
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y + dy, r*0.65, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }

    _tick(){
      if (!this._running) return;
      const now = performance.now();

      // Handle sequence switching
      if (this.sequence && now >= this._nextSwitchAt){
        this._seqIndex = (this._seqIndex + 1) % this.sequence.length;
        this.setText(this.sequence[this._seqIndex], { immediate: false });
      }

      // Determine blended target during morph window
      const tRaw = Math.min(1, Math.max(0, (now - this._switchStart) / this.opts.morphMs));
      const t = easeInOut(tRaw);

      const spring = this.opts.spring;
      const damping = this.opts.damping;
      const maxSpeed = this.opts.maxSpeed;

      const A = this._targetsA;
      const B = this._targetsB;

      for (let i=0;i<this.particles.length;i++){
        const p = this.particles[i];
        const ta = A[i];
        const tb = B[i];
        // blended target path (no sudden jump)
        const tx = ta.x + (tb.x - ta.x) * t;
        const ty = ta.y + (tb.y - ta.y) * t;

        let ax = (tx - p.x) * spring;
        let ay = (ty - p.y) * spring;

        p.vx = (p.vx + ax) * damping;
        p.vy = (p.vy + ay) * damping;

        // clamp speed
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxSpeed){
          p.vx = (p.vx/sp) * maxSpeed;
          p.vy = (p.vy/sp) * maxSpeed;
        }

        p.x += p.vx;
        p.y += p.vy;
      }

      this._drawDots();
      this._raf = requestAnimationFrame(()=>this._tick());
    }
  }

  window.DotMorph = DotMorph;
})();
