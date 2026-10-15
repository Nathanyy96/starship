(function(root,factory){
  var node=typeof module==='object'&&module.exports;
  var api=factory(node?require('./story-1-0-images'):root.StarshipStory10Images,node?require('./story-1-1-images'):root.StarshipStory11Images,node?require('./story-visual-review'):root.StarshipStoryVisualReview);
  if(node)module.exports=api;root.StarshipExplorationStoryArt=api;
}(globalThis,function(images10,images11,review){
  'use strict';
  var views=new WeakMap(),zoom=null,unavailable=new Set();
  function compact(text){return String(text||'').replace(/\s/g,'');}
  function timeline(chapter,act,lines){
    var texts=lines.map(function(line){return compact(Array.isArray(line)?line[1]:line);}),joined=texts.join(''),ends=[],offset=0;
    texts.forEach(function(text){offset+=text.length;ends.push(offset);});
    return review.imagesFor(chapter,chapter==='main-1-1'?images11:images10).filter(function(image){return image.act===act;}).map(function(image,index){
      var at=joined.indexOf(compact(image.anchor));if(at<0)return null;
      return {line:ends.findIndex(function(end){return end>at;}),order:index,src:image.src,caption:image.caption||'第 '+act+' 幕劇情插圖',anchor:image.anchor};
    }).filter(Boolean).sort(function(a,b){return a.line-b.line||a.order-b.order;});
  }
  function current(entries,index){var reached=entries.filter(function(entry){return entry.line<=index;});if(!reached.length)return [];var last=reached[reached.length-1].line;return reached.filter(function(entry){return entry.line===last;});}
  function mount(dialog){
    if(views.has(dialog))return views.get(dialog);
    var doc=dialog.ownerDocument,placeholder=doc.createComment('exploration dialogue home'),copy=doc.createElement('div');copy.className='exploration-art-copy';dialog.before(placeholder);
    while(dialog.firstChild)copy.appendChild(dialog.firstChild);dialog.appendChild(copy);
    var figure=doc.createElement('figure');figure.className='exploration-story-art';figure.hidden=true;
    var button=doc.createElement('button');button.type='button';button.className='exploration-art-expand';button.setAttribute('aria-label','放大查看劇情美術');
    var image=doc.createElement('img');image.alt='';button.appendChild(image);figure.appendChild(button);
    var caption=doc.createElement('figcaption'),text=doc.createElement('span'),controls=doc.createElement('span');controls.className='exploration-art-controls';
    var previous=doc.createElement('button'),count=doc.createElement('span'),next=doc.createElement('button');previous.type=next.type='button';previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','上一張劇情圖');next.setAttribute('aria-label','下一張劇情圖');controls.append(previous,count,next);caption.append(text,controls);figure.appendChild(caption);dialog.prepend(figure);
    var view={figure:figure,image:image,text:text,controls:controls,count:count,items:[],selected:0,key:'',placeholder:placeholder};
    function paint(){var item=view.items[view.selected];if(!item)return;image.src=item.src;image.alt=item.caption;text.textContent=item.caption;count.textContent=(view.selected+1)+' / '+view.items.length;controls.hidden=view.items.length<2;}
    previous.addEventListener('click',function(){view.selected=(view.selected+view.items.length-1)%view.items.length;paint();});next.addEventListener('click',function(){view.selected=(view.selected+1)%view.items.length;paint();});
    image.addEventListener('error',function(){if(view.items[view.selected])unavailable.add(view.items[view.selected].src);clear(dialog);});
    button.addEventListener('click',function(){
      if(zoom)return;var lightbox=doc.createElement('dialog');lightbox.className='exploration-art-lightbox';lightbox.setAttribute('aria-label','劇情美術完整圖片');
      var close=doc.createElement('button');close.type='button';close.textContent='關閉大圖 ✕';var full=doc.createElement('img');full.src=image.src;full.alt=image.alt;
      var toolbar=doc.createElement('div'),magnify=doc.createElement('button'),stage=doc.createElement('div');toolbar.className='exploration-art-fulltools';stage.className='exploration-art-fullstage';magnify.type='button';magnify.textContent='放大 2×';magnify.setAttribute('aria-pressed','false');toolbar.append(magnify,close);stage.appendChild(full);lightbox.append(toolbar,stage);dialog.appendChild(lightbox);zoom=lightbox;
      magnify.addEventListener('click',function(){var enlarged=stage.classList.toggle('is-magnified');magnify.textContent=enlarged?'顯示全圖':'放大 2×';magnify.setAttribute('aria-pressed',String(enlarged));});
      close.addEventListener('click',function(){lightbox.close();});lightbox.addEventListener('close',function(){zoom=null;lightbox.remove();button.focus({preventScroll:true});});lightbox.showModal();close.focus();
    });
    view.paint=paint;views.set(dialog,view);return view;
  }
  function clear(dialog){if(zoom&&dialog.contains(zoom))zoom.close();var view=views.get(dialog);if(view){view.figure.hidden=true;view.key='';view.items=[];if(view.placeholder.parentNode&&dialog.parentNode!==view.placeholder.parentNode)view.placeholder.after(dialog);}dialog.classList.remove('has-exploration-art');}
  function show(dialog,entries,index){
    var items=current(entries,index).filter(function(item){return !unavailable.has(item.src);});if(!items.length){clear(dialog);return;}var view=mount(dialog),key=items.map(function(item){return item.src;}).join('|');
    if(view.key!==key){view.key=key;view.items=items;view.selected=0;view.paint();}view.figure.hidden=false;dialog.classList.add('has-exploration-art');
    // Blurred panels establish a fixed-position containing block. Put the cinema
    // at the viewport root so the illustration cannot be cropped by map panels.
    var root=dialog.ownerDocument.fullscreenElement||dialog.ownerDocument.body;if(dialog.parentNode!==root)root.appendChild(dialog);
  }
  return {timeline:timeline,current:current,show:show,clear:clear,isZoomed:function(){return Boolean(zoom&&zoom.open);}};
}));
