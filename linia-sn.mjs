export const parcels = {
  4: [[763.413,891.603],[779.294,876.045],[795.076,860.579],[811.430,844.565],[824.137,832.121],[824.796,827.854],[833.812,839.830],[829.596,839.270],[814.178,854.361],[799.342,868.894],[784.506,883.427],[769.651,897.981]],
  5: [[824.137,832.121],[811.430,844.565],[787.881,820.512],[806.105,802.482],[812.879,808.593],[824.796,827.854]],
  6: [[771.598,836.605],[787.881,820.512],[811.430,844.565],[795.076,860.579]],
  7: [[755.897,852.150],[771.598,836.605],[795.076,860.579],[779.294,876.045]],
  8: [[740.077,867.777],[755.897,852.150],[779.294,876.045],[763.413,891.603]],
  9: [[794.661,923.532],[788.626,917.371],[769.651,897.981],[784.506,883.427],[809.516,908.979]],
  10: [[784.506,883.427],[799.342,868.894],[824.352,894.446],[809.516,908.979]],
  11: [[799.342,868.894],[814.178,854.361],[839.188,879.913],[824.352,894.446]],
  12: [[814.178,854.361],[829.596,839.270],[833.812,839.830],[853.472,865.937],[839.188,879.913]],
};

// EPSG:2180 minus [463000, 728000]; axis inferred from screenshot, not surveyed.
export const axis = [[789.585,918.345],[799.342,868.894]];
const delta = [axis[1][0]-axis[0][0],axis[1][1]-axis[0][1]];
const length = Math.hypot(...delta);
const normal = [-delta[1]/length,delta[0]/length];
export const distance = ([x,y]) => (x-axis[0][0])*normal[0]+(y-axis[0][1])*normal[1];
export function area(poly) {
  return Math.abs(poly.reduce((sum,p,i) => {
    const q=poly[(i+1)%poly.length];
    return sum+p[0]*q[1]-q[0]*p[1];
  },0))/2;
}
function clip(poly, sign, width) {
  const result=[];
  poly.forEach((p,i) => {
    const q=poly[(i+1)%poly.length];
    const a=sign*distance(p)-width, b=sign*distance(q)-width;
    if(a<=0) result.push(p);
    if((a<=0)!==(b<=0)) {
      const t=a/(a-b);
      result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);
    }
  });
  return result;
}
export const corridor = (poly,width) => clip(clip(poly,1,width),-1,width);

if(typeof document!=='undefined') {
  const ns='http://www.w3.org/2000/svg';
  const map=document.getElementById('parcel-map');
  const shapes=document.getElementById('shapes');
  const labels=document.getElementById('labels');
  const project=([x,y]) => [(x-731)*5,(935-y)*5];
  const points=poly=>poly.map(p=>project(p).join(',')).join(' ');
  function element(tag,attrs,parent) {
    const node=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
    parent.append(node);
    return node;
  }
  function draw() {
    const width=Number(document.getElementById('width').value);
    const alternative=Number(document.getElementById('alternative').value);
    const selected=[7,8,11,12,alternative];
    shapes.replaceChildren(); labels.replaceChildren();
    let total=0;
    for(const [id,poly] of Object.entries(parcels)) {
      const chosen=selected.includes(Number(id));
      element('polygon',{points:points(poly),class:id==='4'?'road':chosen?'chosen':'other'},shapes);
      const band=corridor(poly,width);
      if(band.length) element('polygon',{points:points(band),class:'band'},shapes);
      if(chosen) total+=area(band);
      const center=poly.reduce((a,p)=>[a[0]+p[0]/poly.length,a[1]+p[1]/poly.length],[0,0]);
      const [x,y]=project(center);
      const label=element('text',{x,y,class:id==='4'?'road-label':'parcel-label'},labels);
      label.textContent=`761/${id}`;
    }
    const at=y=>[axis[0][0]+(y-axis[0][1])*delta[0]/delta[1],y];
    element('polyline',{points:points([at(934),at(795)]),class:'axis'},shapes);
    document.getElementById('width-value').textContent=`${width} m od osi · pas ${width*2} m`;
    document.getElementById('summary').textContent=`Wariant z 761/${alternative}: około ${Math.round(total/10)*10} m² pięciu wybranych działek w modelowym pasie. To nie powierzchnia prawnie wyłączona z zabudowy.`;
    document.querySelectorAll('[data-parcel]').forEach(row=> {
      const id=Number(row.dataset.parcel);
      const affected=area(corridor(parcels[id],width));
      row.querySelector('.affected').textContent=affected<.01?'0 w modelu':affected<10?'< 10 m² (mały fragment)':`≈ ${Math.round(affected/10)*10} m²`;
      row.classList.toggle('selected-row',selected.includes(id));
    });
    map.setAttribute('aria-label',`Mapa działek. Modelowy pas ${width} metrów po obu stronach orientacyjnej osi linii. Wybrany wariant z działką ${alternative}.`);
  }
  document.getElementById('width').addEventListener('input',draw);
  document.getElementById('alternative').addEventListener('change',draw);
  draw();
}
