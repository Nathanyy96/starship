// Reads alpha bounds only; generated PNG files are kept intact.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),roster=require('../docs/character-motion-roster-20261015.json');
(async()=>{
  const manifest={};
  for(const {id,name} of roster){
    const src='./assets/exploration/motion/'+id+'-walk-v2.png';
    const {data,info}=await sharp(path.join(root,src)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const {width:w,height:h}=info,seen=new Uint8Array(w*h),parts=[];
    for(let i=0;i<seen.length;i++){
      if(seen[i]||data[i*4+3]<128)continue;
      const queue=[i];seen[i]=1;let area=0,x0=w,y0=h,x1=0,y1=0;
      while(queue.length){
        const v=queue.pop(),x=v%w,y=Math.floor(v/w);area++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        for(const u of [x>0?v-1:-1,x<w-1?v+1:-1,y>0?v-w:-1,y<h-1?v+w:-1])if(u>=0&&!seen[u]&&data[u*4+3]>=128){seen[u]=1;queue.push(u);}
      }
      if(area>3000)parts.push({x0,y0,x1,y1});
    }
    if(parts.length!==16)throw new Error(id+': expected sixteen separate sprites, found '+parts.length);
    parts.sort((a,b)=>(a.y0+a.y1)-(b.y0+b.y1));
    const ordered=[];for(let row=0;row<4;row++)ordered.push(...parts.slice(row*4,row*4+4).sort((a,b)=>(a.x0+a.x1)-(b.x0+b.x1)));
    const frames=ordered.map(p=>{const x=Math.max(0,p.x0-2),y=Math.max(0,p.y0-2);return [x/w,y/h,(Math.min(w,p.x1+3)-x)/w,(Math.min(h,p.y1+3)-y)/h];});
    manifest[id]={name,src,bodyHeight:Math.max(...frames.map(r=>r[3])),frames};
    console.log(id+': 16 frames, '+w+'×'+h);
  }
  fs.writeFileSync(path.join(root,'src/character-motion-manifest.js'),'(function(root){var manifest='+JSON.stringify(manifest)+';if(typeof module==="object"&&module.exports)module.exports=manifest;root.StarshipCharacterMotionManifest=manifest;}(typeof globalThis!=="undefined"?globalThis:this));\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
