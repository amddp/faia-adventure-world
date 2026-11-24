/* FAIA Adventure World - game edukasi 3D satu halaman */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ui = {
    welcome:$("welcome"), hud:$("hud"), levelPanel:$("levelPanel"), modal:$("modal"),
    star:$("starCount"), level:$("levelCount"), world:$("worldName"), title:$("missionTitle"),
    question:$("questionText"), objects:$("questionObjects"), answers:$("answers"),
    feedback:$("feedback"), progress:$("progressFill"), progressText:$("progressText"),
    toast:$("toast"), hint:$("interactionHint")
  };
  const WORLD_NAMES=["Hutan Angka","Kebun Hitung","Taman Penjumlahan","Pantai Pengurangan","Lembah Ajaib","Kota Alfabet","Desa Suku Kata","Kampung Kata","Perpustakaan Ceria","Istana Bintang"];
  const ICONS=["🍎","🌼","🦋","⭐","🍓","🐠","🎈","🐞","🍊","🐚"];
  const WORDS=[
    ["API","🔥","A - P - I"],["IBU","👩","I - B - U"],["MATA","👀","MA - TA"],
    ["BOLA","⚽","BO - LA"],["BUKU","📘","BU - KU"],["SAPI","🐮","SA - PI"],
    ["AYAH","👨","A - YAH"],["MAKAN","🍽️","MA - KAN"],["BUNGA","🌷","BU - NGA"],
    ["KUCING","🐱","KU - CING"]
  ];
  let level=1, stars=0, soundOn=true, current=null, answered=false, freeMode=false;
  let scene,camera,renderer,clock,faia,keys={},touchMove={x:0,z:0},jumping=false;
  let speechVoices=[];
  try { speechVoices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch(e) {}
  function say(text){
    if(!soundOn || !("speechSynthesis" in window)) return;
    try { speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="id-ID";u.rate=.86;u.pitch=1.16;u.volume=.9;
      const v=speechVoices.find(x=>x.lang.toLowerCase().startsWith("id"));if(v)u.voice=v;speechSynthesis.speak(u);
    } catch(e){}
  }
  function toast(t){ui.toast.textContent=t;ui.toast.classList.add("show");setTimeout(()=>ui.toast.classList.remove("show"),2100)}
  function save(){localStorage.setItem("faiaAdventureSave",JSON.stringify({level,stars}))}
  function load(){try{const s=JSON.parse(localStorage.getItem("faiaAdventureSave")||"{}");level=Math.max(1,Math.min(100,s.level||1));stars=s.stars||0}catch(e){}updateStats()}
  function updateStats(){ui.star.textContent=stars;ui.level.textContent=level}
  function init3D(){
    const host=$("scene");
    if(!window.THREE){host.innerHTML='<div class="fallback">3D membutuhkan koneksi internet untuk memuat Three.js.</div>';return}
    try{
      scene=new THREE.Scene();scene.background=new THREE.Color(0x9bdcf6);scene.fog=new THREE.Fog(0x9bdcf6,22,62);
      camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,150);
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      host.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xffffff,0x82a76f,2));
      const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-8,15,8);sun.castShadow=true;scene.add(sun);
      const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:0x8bd29c,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
      // Jalan melengkung dan pulau-pulau dekoratif
      const path=new THREE.Mesh(new THREE.TorusGeometry(7,.75,8,90),new THREE.MeshStandardMaterial({color:0xf4d6a0}));path.rotation.x=Math.PI/2;path.position.y=.02;path.scale.set(1.35,1,1);scene.add(path);
      for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const x=Math.cos(a)*12,z=Math.sin(a)*9;
        const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,1.4,7),new THREE.MeshStandardMaterial({color:0x95613f}));trunk.position.set(x,.7,z);scene.add(trunk);
        const crown=new THREE.Mesh(new THREE.SphereGeometry(1.05,9,8),new THREE.MeshStandardMaterial({color:[0x59b978,0x72c982,0x8acb70][i%3]}));crown.position.set(x,1.8,z);crown.scale.y=1.15;scene.add(crown);
        const flower=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),new THREE.MeshStandardMaterial({color:[0xffd66b,0xffa9d2,0xc8a7ff][i%3]}));flower.position.set(x+1.1,.25,z+.4);scene.add(flower);
      }
      for(let i=0;i<13;i++){const cloud=new THREE.Group();for(let j=0;j<4;j++){const c=new THREE.Mesh(new THREE.SphereGeometry(.8,10,8),new THREE.MeshStandardMaterial({color:0xffffff}));c.position.set(j*.7,Math.random()*.25,0);cloud.add(c)}cloud.position.set((i-6)*6,8+Math.random()*5,-17-Math.random()*22);cloud.scale.setScalar(.7+Math.random()*.5);scene.add(cloud)}
      faia=makeFaia();scene.add(faia);faia.position.set(0,0,0);
      camera.position.set(0,5.2,9);camera.lookAt(0,1,0);clock=new THREE.Clock();
      animate();window.addEventListener("resize",resize);
    }catch(err){host.innerHTML='<div class="fallback">Perangkat ini belum mendukung tampilan 3D. Coba browser terbaru.</div>';console.error(err)}
  }
  function makeFaia(){
    const g=new THREE.Group();
    const mat=(c,rough=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:rough});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.62,5,10),mat(0x399d91));body.position.y=.85;body.castShadow=true;g.add(body);
    const head=new THREE.Group();head.position.y=2.05;g.add(head);
    const hijab=new THREE.Mesh(new THREE.SphereGeometry(.78,24,20),mat(0x667329));hijab.scale.set(1,1.12,.88);hijab.castShadow=true;head.add(hijab);
    const face=new THREE.Mesh(new THREE.SphereGeometry(.59,24,20),mat(0xf3c5a8));face.scale.set(.88,.88,.48);face.position.set(0,-.08,.36);head.add(face);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.68,20,14,0,Math.PI*2,0,Math.PI*.58),mat(0x667329));cap.scale.set(1.12,1,.95);cap.position.set(0,.18,.05);head.add(cap);
    const eyeMat=mat(0x211b2c,.25);[-.22,.22].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.075,12,10),eyeMat);e.position.set(x,-.06,.79);head.add(e)});
    const smile=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,6,16,Math.PI),mat(0xb76f78));smile.position.set(0,-.31,.81);smile.rotation.z=Math.PI;head.add(smile);
    // Hiasan bunga warna-warni di tepi hijab
    const flowerColors=[0xffd34f,0xf18ac8,0x9ddf74,0xf4a1bd,0xb78bea];
    for(let i=0;i<7;i++){const a=Math.PI*.12+i/6*Math.PI*.76;const f=new THREE.Group();const center=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),mat(0xffe78b));f.add(center);
      for(let p=0;p<5;p++){const ang=p/5*Math.PI*2;const pet=new THREE.Mesh(new THREE.SphereGeometry(.075,8,8),mat(flowerColors[i%flowerColors.length]));pet.position.set(Math.cos(ang)*.105,Math.sin(ang)*.105,0);f.add(pet)}
      f.position.set(Math.cos(a)*.62,Math.sin(a)*.61+.17,.48);head.add(f)}
    const arms=[];[-1,1].forEach(side=>{const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.42,4,8),mat(0xd9c98a));arm.position.set(side*.55,1.05,0);arm.rotation.z=side*-.35;g.add(arm);arms.push(arm)});
    const bag=new THREE.Mesh(new THREE.BoxGeometry(.45,.55,.25),mat(0xa77bd1));bag.position.set(0,1.05,-.48);g.add(bag);
    g.userData={arms,head};return g;
  }
  function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
  function animate(){
    requestAnimationFrame(animate);if(!renderer)return;const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
    if(faia){
      const dx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0)+touchMove.x;
      const dz=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0)+touchMove.z;
      if(dx||dz){faia.position.x+=dx*dt*4;faia.position.z+=dz*dt*4;faia.rotation.y=Math.atan2(dx,dz);faia.userData.arms.forEach((a,i)=>a.rotation.x=Math.sin(t*10+i*Math.PI)*.35)}
      else faia.userData.arms.forEach(a=>a.rotation.x=0);
      faia.position.x=THREE.MathUtils.clamp(faia.position.x,-17,17);faia.position.z=THREE.MathUtils.clamp(faia.position.z,-17,17);
      if(jumping){faia.position.y=Math.max(0,Math.sin(t*8)*.9);if(touchMove.jumpUntil<t)jumping=false}else faia.position.y=0;
      faia.userData.head.rotation.z=Math.sin(t*1.5)*.025;
      camera.position.lerp(new THREE.Vector3(faia.position.x,faia.position.y+5.2,faia.position.z+8.5),.06);
      camera.lookAt(faia.position.x,1.1,faia.position.z);
    }
    renderer.render(scene,camera);
  }
  function jump(){if(!faia)return;touchMove.jumpUntil=clock.elapsedTime+.55;jumping=true}
  function makeQuestion(lvl){
    const band=Math.ceil(lvl/10),n=Math.min(10,((lvl-1)%10)+1);
    let a,b,correct,choices,question,objects,kind;
    if(band===1||band===2){
      kind="count";correct=n;objects=Array.from({length:n},()=>ICONS[(lvl-1)%ICONS.length]).join(" ");
      question=band===1?`Angka berapa yang cocok dengan ${n} benda ini?`:`Ayo hitung semuanya. Ada berapa ${n===1?"benda":"benda"}?`;
      say(`Halo FAIA! Ayo hitung bersama. Ada ${n} benda. Pilih angka yang tepat.`);
    }else if(band===3||band===5||band===10){
      kind="add";a=1+((lvl*3)%5);b=1+((lvl*2)%Math.max(2,6-a));correct=Math.min(10,a+b);objects=`${ICONS[lvl%ICONS.length]} `.repeat(a)+` + ${ICONS[(lvl+2)%ICONS.length]} `.repeat(b);
      question=`${a} + ${b} = berapa?`;say(`FAIA punya ${a} benda, lalu mendapat ${b} lagi. Berapa semuanya?`);
    }else if(band===4){
      kind="subtract";a=3+((lvl*2)%7);b=1+((lvl*3)%Math.max(1,a-1));correct=a-b;objects=`${ICONS[(lvl+3)%ICONS.length]} `.repeat(a)+`  (ambil ${b})`;
      question=`${a} − ${b} = berapa?`;say(`Ada ${a} benda. ${b} diambil. Berapa yang tersisa?`);
    }else{
      kind="read";const entry=WORDS[(lvl+band)%WORDS.length];correct=entry[0];objects=`<span class="word-picture">${entry[1]}</span><strong>${entry[0]}</strong>`;
      question=`Ayo baca kata ini: ${entry[0]}`;say(`Ini gambar ${entry[0]}. Ayo baca bersama. ${entry[2]}. ${entry[0]}!`);
    }
    if(kind==="read"){
      const wrong=WORDS.filter(w=>w[0]!==correct).sort(()=>Math.random()-.5).slice(0,2).map(w=>w[0]);choices=[correct,...wrong].sort(()=>Math.random()-.5);
    }else{
      const set=new Set([correct]);while(set.size<3){set.add(Math.max(0,Math.min(10,correct+(Math.floor(Math.random()*5)-2||1))))}choices=[...set].sort(()=>Math.random()-.5);
    }
    return {band,kind,correct,choices,question,objects};
  }
  function startLevel(lvl){
    level=Math.max(1,Math.min(100,lvl));answered=false;current=makeQuestion(level);updateStats();save();
    ui.welcome.classList.add("hidden");ui.levelPanel.classList.add("hidden");ui.modal.classList.add("hidden");ui.hud.classList.remove("hidden");
    ui.world.textContent=WORLD_NAMES[Math.ceil(level/10)-1].toUpperCase();ui.title.textContent=`Misi ${level}`;
    ui.question.textContent=current.question;ui.objects.innerHTML=current.objects;ui.answers.innerHTML="";
    current.choices.forEach(c=>{const btn=document.createElement("button");btn.className="answer-btn";btn.textContent=c;btn.addEventListener("click",()=>choose(c));ui.answers.appendChild(btn)});
    ui.feedback.textContent="Pilih jawaban yang benar, ya!";ui.progress.style.width=`${level}%`;ui.progressText.textContent=`Level ${level} dari 100`;
  }
  function choose(value){
    if(answered)return;
    if(String(value)===String(current.correct)){
      answered=true;stars++;updateStats();save();ui.feedback.textContent="Hebat sekali, FAIA! 🌟";ui.feedback.style.color="#398c70";
      ui.answers.querySelectorAll("button").forEach(b=>{b.disabled=true;if(String(b.textContent)===String(value))b.style.background="#c9f1d9"});
      say("Hebat sekali, FAIA! Kamu pintar!");toast("🌟 Kamu mendapat satu bintang!");
      setTimeout(()=>{
        ui.modal.classList.remove("hidden");$("modalIcon").textContent="🌸🌟";$("modalTitle").textContent="Hebat sekali, FAIA!";
        $("modalText").textContent=level===100?"Kamu menaklukkan semua 100 level! Luar biasa!":"Misi berhasil! Satu bintang untuk FAIA. Siap lanjut berpetualang?";
        $("nextBtn").textContent=level===100?"Main Lagi ✨":"Level Berikutnya ✨";
      },650);
    }else{
      ui.feedback.textContent="Tidak apa-apa, FAIA. Ayo coba lagi! 💗";ui.feedback.style.color="#b66b91";say("Tidak apa-apa, FAIA. Ayo kita coba lagi!");toast("Coba sekali lagi, ya!");
    }
  }
  function nextLevel(){if(level<100)level++;else level=1;startLevel(level)}
  function showLevels(){
    ui.welcome.classList.add("hidden");ui.hud.classList.add("hidden");ui.levelPanel.classList.remove("hidden");ui.modal.classList.add("hidden");
    const grid=$("worldGrid");grid.innerHTML="";
    WORLD_NAMES.forEach((name,i)=>{const first=i*10+1;const btn=document.createElement("button");btn.className="world-card";btn.innerHTML=`🌈 ${name}<small>Level ${first}–${first+9}</small>`;btn.addEventListener("click",()=>startLevel(Math.min(100,first)));grid.appendChild(btn)});
  }
  function home(){ui.hud.classList.add("hidden");ui.levelPanel.classList.add("hidden");ui.modal.classList.add("hidden");ui.welcome.classList.remove("hidden");say("Selamat datang kembali, FAIA!")}
  function startFree(){freeMode=true;ui.welcome.classList.add("hidden");ui.hud.classList.add("hidden");ui.levelPanel.classList.add("hidden");toast("Jelajah bebas! Gunakan tombol panah atau WASD.");say("Ayo FAIA, kita jalan-jalan di dunia ajaib!");}
  $("adventureBtn").addEventListener("click",()=>startLevel(level));
  $("freeBtn").addEventListener("click",startFree);
  $("learnBtn").addEventListener("click",showLevels);
  $("levelClose").addEventListener("click",home);$("homeBtn").addEventListener("click",home);
  $("nextBtn").addEventListener("click",nextLevel);
  $("soundBtn").addEventListener("click",()=>{soundOn=!soundOn;$("soundBtn").textContent=soundOn?"🔊":"🔇";if(!soundOn&&window.speechSynthesis)speechSynthesis.cancel();else say("Suara dinyalakan")});
  $("helpBtn").addEventListener("click",()=>{toast("Gerakkan FAIA dengan WASD / tombol panah. Jawab soal untuk mendapat bintang.");say("Gunakan tombol panah untuk berjalan. Jawab pertanyaan untuk mendapat bintang.")});
  $("jumpBtn").addEventListener("click",jump);
  document.querySelectorAll("[data-move]").forEach(btn=>{
    const dir=btn.dataset.move;const set=(on)=>{if(dir==="left")touchMove.x=on?-.9:0;if(dir==="right")touchMove.x=on?.9:0;if(dir==="forward")touchMove.z=on?-.9:0;if(dir==="back")touchMove.z=on?.9:0};
    btn.addEventListener("pointerdown",e=>{e.preventDefault();set(true)});["pointerup","pointerleave","pointercancel"].forEach(ev=>btn.addEventListener(ev,()=>set(false)));
  });
  window.addEventListener("keydown",e=>{keys[e.key]=true;if(e.key===" "){e.preventDefault();jump()}});
  window.addEventListener("keyup",e=>{keys[e.key]=false});
  load();init3D();
  if("speechSynthesis" in window)speechSynthesis.onvoiceschanged=()=>{speechVoices=speechSynthesis.getVoices()};
})();