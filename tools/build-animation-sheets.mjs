import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.STARSHIP_SHARP_MODULE||'sharp');
const [sourceDirectory,outputDirectory]=process.argv.slice(2);
if(!sourceDirectory||!outputDirectory)throw Error('Usage: node build-animation-sheets.mjs source-directory output-directory');
const ranges=['01-04','05-08','09-12','13-16','17-20','21-24'];
const rightward=process.argv[4]==="right",cellWidth=rightward?512:384,cellHeight=rightward?256:384,frames=[],sources=[],composite=[];
fs.mkdirSync(outputDirectory,{recursive:true});
for(const range of ranges){
  const file=path.join(sourceDirectory,'celesia-hd-'+range+'.png'),source=fs.readFileSync(file),meta=await sharp(source).metadata();
  if(!meta.hasAlpha)throw Error('Expected alpha sheet: '+range);
  sources.push({file:path.basename(file),sha256:crypto.createHash('sha256').update(source).digest('hex'),width:meta.width,height:meta.height});
  for(let cell=0;cell<4;cell++){
    const left=Math.floor(cell%2*meta.width/2),top=Math.floor(Math.floor(cell/2)*meta.height/2),width=Math.floor((cell%2+1)*meta.width/2)-left,height=Math.floor((Math.floor(cell/2)+1)*meta.height/2)-top,index=frames.length;
    const {data,info}=await sharp(source).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let visible=0,clear=0;
    for(let p=3;p<data.length;p+=4){if(data[p]<16){data[p]=0;clear++;}else visible++;}
    if(visible<width*height*.08||clear<width*height*.12)throw Error('Empty frame or missing alpha padding: '+index);
    let pipeline=sharp(data,{raw:info});
    if(rightward)pipeline=pipeline.resize(cellWidth,cellHeight,{fit:'contain',background:'#00000000'});
    else pipeline=pipeline.resize(320,320,{fit:'contain',background:'#00000000'}).extend({top:32,bottom:32,left:32,right:32,background:'#00000000'});
    const tile=await pipeline.png().toBuffer();
    const name=String(index).padStart(2,'0')+'.webp';
    await sharp(tile).webp({quality:90,alphaQuality:100,effort:4}).toFile(path.join(outputDirectory,name));
    frames.push({index,file:name,width:cellWidth,height:cellHeight,sha256:crypto.createHash('sha256').update(tile).digest('hex')});
    composite.push({input:tile,left:index%6*cellWidth,top:Math.floor(index/6)*cellHeight});
  }
}
if(new Set(frames.map(f=>f.sha256)).size!==24)throw Error('Expected 24 different drawings');
await sharp({create:{width:cellWidth*6,height:cellHeight*4,channels:4,background:'#00000000'}}).composite(composite).webp({quality:90,alphaQuality:100,effort:4}).toFile(path.join(outputDirectory,'basic.webp'));
const bytes=fs.statSync(path.join(outputDirectory,'basic.webp')).size;
fs.writeFileSync(path.join(outputDirectory,'manifest.json'),JSON.stringify({version:1,characterId:'celesia',nativeRarity:4,action:'basic',direction:rightward?'right':'unreviewed',status:'pending-visual-review',columns:6,rows:4,width:cellWidth,height:cellHeight,frameMs:26,durationMs:624,bytes,sources,frames},null,2));
console.log(JSON.stringify({frames:frames.length,bytes,decodedBytes:cellWidth*6*cellHeight*4*4}));
