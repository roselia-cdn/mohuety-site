"use strict";
(function(HOST){
    let ADVB = function (o){
        const defaults = {
            global: {
                element: null,
                hoverHeight: 25,
                defaultHeight: 5,
                marginLeft: "37%",
                data: {}
            },
            events:[]
        };
        let dat = new Date;
        let _ = ADVB.utils;
        this.setCurrentDate = function(date) {
            dat = new Date(date);
            this.destroy();
            this.init();
        }
        this.createElement = function(payload, before){
            //Create <div> tag
            var divTag = document.createElement('div');

            // Create <a> tag
            var aTag = document.createElement('a');
            aTag.setAttribute('target', '_blank');

            // Create <span> tag
            var span = document.createElement('span');
            span.setAttribute('style', 'opacity: 0;');
            span.innerHTML = _.render(payload.text, payload.data);
            span.style.marginLeft = payload.marginLeft || o.global.marginLeft || "37%";
            aTag.addEventListener("mouseenter", e => {
                span.style.opacity = 100;
                e.target.style.height = (o.global.hoverHeight || payload.hoverHeight)+"px";
            });
            aTag.addEventListener("mouseout", e => {
                span.style.opacity = 0;
                e.target.style.height = (o.global.defaultHeight || payload.defaultHeight)+"px";
            });
            this.aElement = aTag;
            this.divElement = divTag;
            this.spanElement = span;
            ["div", "a", "span"].forEach(tag => _.deepExtend(this[tag+"Element"], payload[tag+"Extend"] || {}))
            this.aElement.style.cssText = _.render('\
                background-color: {{ color }};\
                background-size: cover;\
                position: absolute;\
                top: 0;\
                left: 0;\
                width: 100%;\
                width: 100vw;\
                height: {{defaultHeight}}px;\
                z-index: 99999;\
            ', Object.assign({color: payload.color, defaultHeight: o.global.defaultHeight}, payload.data));
            aTag.style.color = payload.textColor || o.global.textColor || "";

            aTag.appendChild(span);
            divTag.appendChild(aTag);
            document.body.insertBefore(divTag, before || document.body.firstChild);
            return () => {
                document.body.removeChild(divTag);
            };
        }
        this.init = function() {
            o.global = o.global || {};
            _.deepExtend(o.global, defaults.global);
            //console.log(o);
            let opts = o.events;
            //Rendering Elements of needsRender
            opts.forEach(e => {
                Object.assign(e.data||{}, o.global.data);
                (e.needsRender || []).forEach(structure => {
                    let target = e, prevTarget = e;//structure.split(".").reduce((a,b) => a[b], e);
                    let varMap = structure.split('.');
                    varMap.forEach(s => {
                        prevTarget = target;
                        target = target[s];
                    });
                    prevTarget[varMap[varMap.length - 1]] = _.render(target, e.data);
                })
            });
            //console.log(opts);
            let targets = opts.filter(d => _.sameDate(d.date, dat, d.match || o.global.match));
            this.targets = targets.length ? targets : opts.filter(d => d.date === "else");
            this.removeChildren = this.targets.map(e => this.createElement(e, o.global.element));
        };

        this.destroy = function() {
            this.removeChildren.forEach(f => f());
            this.removeChildren = [];
        }
        this.init();
        
    }
    //Inspired by haskell
    let on = (f1, f2) => (a, b) => f2(f1(a), f1(b));
    let equalsOn = f => on(f, (a,b) => a===b);

    ADVB.of = function(opts){
        return new this(opts);
    }
    ADVB.utils = {
        forEach(o, f){
            for(let k in o) f(o[k],k,o);
        },
        reduce(o, f, b){
            this.forEach(o, (...args) => b = f(b, ...args));
            return b;
        },
        procedure: (...args) => args.reduce((a,b) => b(a)),
        applyTo: (a, ...args) => args.forEach(f => f(a)),
        sameDate: (a,b,m) => (a!=="never" && a!=="else") && (a==="always" || (m || ["Month", "Date"]).map(s => s.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).every(attr => equalsOn(x => x["get"+attr]&&x["get"+attr]())(new Date(a), b))),
        render(str, obj, delim){// A naive template engine.
            //console.log("RENDER:",str, obj)
            delim = delim || ["{{", "}}"];
            return this.reduce(obj, (s, v, k) => s.replace(new RegExp(delim.join(`\\s*?${k}\\s*?`), "g"), v), str);
        },
        extend(dst, src){
            this.forEach(src, (v, k) => dst[k] = dst[k] || v);
        },
        deepExtend(dst, src){
            src = src || {};
            this.forEach(src, (v, k) => {
                if(typeof(v) == "object"){
                    dst[k] = this.deepExtend(dst[k], v);
                }else{
                    dst[k] = dst[k] || v;
                }
            });
            return dst;
        }
    };
    ADVB.helper = (template, datas) => datas.map(d => Object.assign(JSON.parse(JSON.stringify(template)), {data: Object.assign({}, template.data || {}, d)}));
    HOST.AdovecNotify = ADVB;
})(window);