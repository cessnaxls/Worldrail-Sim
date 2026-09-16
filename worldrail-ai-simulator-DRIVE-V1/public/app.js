(() => {
  const START = [39.8329, -86.1458]; // Indianapolis starter view
  const map = L.map('map', {zoomControl:true, preferCanvas:true, zoomAnimation:false, fadeAnimation:false, markerZoomAnimation:false}).setView(START, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    crossOrigin: true
  }).addTo(map);

  const networkLayer = L.layerGroup().addTo(map);
  const stationLayer = L.layerGroup().addTo(map);
  let centerMarker = null;
  let radiusCircle = null;
  let center = null;

  const $ = id => document.getElementById(id);
  const status = $('status');
  const radius = $('r');
  const rv = $('rv');

  function placeCenter(latlng, pan=true){
    center = latlng;
    if (centerMarker) centerMarker.remove();
    centerMarker = L.circleMarker(latlng,{radius:7,color:'#0b0e12',weight:2,fillColor:'#4da3ff',fillOpacity:1}).addTo(map).bindTooltip('Network center / main terminus');
    if (radiusCircle) radiusCircle.remove();
    radiusCircle = L.circle(latlng,{radius:+radius.value*1609.344,color:'#4da3ff',weight:1,opacity:.65,fillColor:'#4da3ff',fillOpacity:.04,dashArray:'6 6'}).addTo(map);
    networkLayer.clearLayers(); stationLayer.clearLayers();
    status.textContent = `Center placed at ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}. Configure and generate.`;
    if (pan) map.panTo(latlng);
  }

  map.on('click', e => placeCenter(e.latlng,false));

  radius.addEventListener('input',()=>{
    rv.value = radius.value+' mi';
    if(radiusCircle) radiusCircle.setRadius(+radius.value*1609.344);
  });

  function destination(origin, bearingDeg, distanceM){
    const R=6378137, br=bearingDeg*Math.PI/180, lat1=origin.lat*Math.PI/180, lon1=origin.lng*Math.PI/180, d=distanceM/R;
    const lat2=Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(br));
    const lon2=lon1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));
    return L.latLng(lat2*180/Math.PI,lon2*180/Math.PI);
  }

  function generate(){
    if(!center){ status.textContent='Tap the map first to place the network center.'; return; }
    networkLayer.clearLayers(); stationLayer.clearLayers();
    const miles=+radius.value;
    const dist=miles*1609.344;
    const branches=Math.max(3,Math.min(9,Math.round(miles/4)+3));
    const tracks=$('tracks').value;
    const mode=$('mode').value;

    const terminal=L.circleMarker(center,{radius:10,color:'#111',weight:3,fillColor:'#f0c95c',fillOpacity:1,className:'network-terminal'}).addTo(stationLayer);
    terminal.bindTooltip('WORLDRAIL CENTRAL TERMINUS',{permanent:false});

    for(let a=0;a<branches;a++){
      const base=a*360/branches + 11*Math.sin(a*1.7);
      const pts=[center];
      const stations=[];
      const segments=7;
      for(let k=1;k<=segments;k++){
        const frac=k/segments;
        const curve=7*Math.sin(k*.95+a*.7)*(1-frac*.35);
        const p=destination(center,base+curve,dist*frac);
        pts.push(p);
        if(k<segments){
          stations.push(p);
          L.circleMarker(p,{radius:4,color:'#111',weight:1,fillColor:'#eef3f8',fillOpacity:1}).addTo(stationLayer)
            .bindTooltip(`Line ${a+1} • Station ${k}`);
        }
      }
      L.polyline(pts,{color:a<2?'#f0c95c':'#c7d0d9',weight:a<2?5:4,opacity:.95,lineJoin:'round'}).addTo(networkLayer)
       .bindTooltip(`Line ${a+1} • ${mode} • ${tracks}`);
    }

    map.fitBounds(radiusCircle.getBounds(),{padding:[28,28]});
    status.textContent=`Generated ${branches} lines feeding one common terminal. ${tracks}; ${mode}. Starter geometry includes stations and line paths; real OSM/census-aware routing is the next data layer.`;
  }

  $('gen').addEventListener('click',generate);
  const gridButtons=[...document.querySelectorAll('.grid button')];
  const driveButton=gridButtons.find(b=>b.textContent.trim()==='Drive');
  if(driveButton) driveButton.addEventListener('click',()=>window.WorldRailDrive && WorldRailDrive.start());
  gridButtons.filter(b=>b!==driveButton).forEach(b=>b.addEventListener('click',()=>{status.textContent=b.textContent+' panel is integrated into Drive mode in this build.'}));
  $('home').addEventListener('click',()=>map.setView(START,12));
  $('locate').addEventListener('click',()=>{
    status.textContent='Requesting your location…';
    map.locate({setView:true,maxZoom:14,enableHighAccuracy:true,timeout:10000});
  });
  map.on('locationfound',e=>placeCenter(e.latlng,false));
  map.on('locationerror',()=>status.textContent='Location permission was unavailable. Tap the map to choose a center manually.');

  fetch('assets/library.json').then(r=>r.json()).then(a=>{
    const m={};a.forEach(o=>m[o.category]=(m[o.category]||0)+1);
    $('assets').innerHTML=Object.entries(m).map(([k,v])=>`${k}: <b>${v}</b>`).join('<br>')+`<br><b>Total: ${a.length}</b>`;
  }).catch(()=>{$('assets').textContent='Asset catalog unavailable.'});

  // Important for Safari/iPad and Render containers: Leaflet must be told to recalc after layout settles.
  const repairMapSize=()=>map.invalidateSize({pan:false,animate:false});
  requestAnimationFrame(repairMapSize);
  setTimeout(repairMapSize,100);
  setTimeout(repairMapSize,400);
  setTimeout(repairMapSize,1000);
  window.addEventListener('resize',()=>setTimeout(repairMapSize,80));
  window.addEventListener('orientationchange',()=>setTimeout(repairMapSize,250));
  if (window.visualViewport) visualViewport.addEventListener('resize',()=>setTimeout(repairMapSize,80));
})();
