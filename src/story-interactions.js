(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipStoryInteractions=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // These interludes return to the same published line, regardless of the reply.
  var events=[
    {id:'village-guide',act:2,scene:1,anchor:'他看了她一會兒，轉身往外走。',kind:'follow',actor:'reyn',name:'雷恩',title:'跟著雷恩走一段村道',hint:'沿路跟上雷恩；落後時他會停下等你。'},
    {id:'nearby-reply',act:2,scene:1,anchor:'「只能走近的。」',kind:'choice',title:'回應雷恩',choices:[
      {text:'我會跟著你的步伐。',speaker:'雷恩',reply:'「走不穩就停下來，別勉強。」'},
      {text:'到岔路時，讓我停下來記一下。',speaker:'雷恩',reply:'「那就到岔路再停。先看腳下。」'}]},
    {id:'workshop-check',act:4,scene:2,anchor:'「那就先把繩繫好。」',kind:'inspect',title:'出發前的安全確認',steps:[
      {name:'檢查接應繩結',result:'你沿繩結確認受力方向，沒有留下鬆開的繩圈。'},
      {name:'查看完整地面',result:'你看清腳下與回程的位置，回到同伴能接應的地方。'}]},
    {id:'landing-signal',act:12,scene:2,anchor:'天黑後，兩岸用燈與短聲清點人數。',kind:'inspect',title:'協助兩岸清點',steps:[
      {name:'查看近岸回燈',result:'你在近岸確認燈的位置，讓遮住燈光的物件移開。'},
      {name:'協助回應清點',result:'你留在近岸回應清點，沒有踏上錯位的石階。'}]},
    {id:'upstream-guide',act:13,scene:0,anchor:'其他人帶繩、藥與武器，沿普通山路走向上游。',kind:'follow',actor:'reyn',name:'雷恩',title:'跟隨雷恩前往上游山路',hint:'沿同一岸的山路走，雷恩會在前方等候。'},
    {id:'listen-reply',act:15,scene:2,anchor:'「我沒有怪妳出來。',kind:'choice',title:'陪同伴把話說完',choices:[
      {text:'安靜聽她們說完。',speaker:'旁白',reply:'你把想說的話暫時留住，讓同伴先把心裡的話說完。'},
      {text:'把水放到她們手邊。',speaker:'旁白',reply:'你把水放到伸手能拿到的地方，坐回原處，繼續聽她們交談。'}]}
  ];
  function match(act,scene,text){return events.find(function(e){return e.act===act&&e.scene===scene&&text.indexOf(e.anchor)!==-1;})||null;}
  function create(options){
    var current=null,seen={},lastActor=null,view=null;
    var directions=[[-1,0],[-1,-1],[0,-1],[-1,1],[0,1],[1,-1],[1,0],[1,1]];
    function routeLength(points){return points.reduce(function(sum,p,i){return i?sum+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):sum;},0);}
    function planNear(origin,radius,offset){
      for(var i=0;i<directions.length;i++){var v=directions[(i+(offset||0))%directions.length],length=Math.hypot(v[0],v[1]),target={x:origin.x+v[0]/length*radius,y:origin.y+v[1]/length*radius},path=options.plan(origin,target);if(path.length&&routeLength([origin].concat(path))<radius*2.2)return path;}
      return [];
    }
    function paint(){
      if(!view)return;view.root.hidden=!current||!(current.event.kind==='choice'||current.phase==='done');
      if(view.root.hidden)return;view.title.textContent=current.event.title;view.copy.textContent=current.phase==='reply'?current.reply:current.phase==='done'?current.feedback:'選擇一句回應，之後繼續原劇情。';view.buttons.replaceChildren();
      if(current.event.kind==='choice'&&current.phase==='choosing')current.event.choices.forEach(function(c,i){var b=view.doc.createElement('button');b.type='button';b.textContent=c.text;b.addEventListener('click',function(){choose(i);});view.buttons.appendChild(b);});
      else{var b=view.doc.createElement('button');b.type='button';b.textContent='繼續交談';b.addEventListener('click',action);view.buttons.appendChild(b);}
      var first=view.buttons.querySelector('button');if(first)first.focus({preventScroll:true});
    }
    function finish(){if(!current)return;seen[current.key]=true;current=null;paint();options.resume();}
    function action(){
      if(!current)return false;var player=options.player();
      if(current.phase==='reply'||current.phase==='done'){finish();return true;}
      if(current.event.kind==='choice')return true;
      if(current.event.kind==='follow'){
        if(current.path.length||Math.hypot(player.x-current.actor.x,player.y-current.actor.y)>48)return true;
        lastActor=Object.assign({},current.actor,{walking:false});finish();return true;
      }
      var target=current.targets[current.step];if(Math.hypot(player.x-target.x,player.y-target.y)>46||!options.plan(player,target).length)return true;
      current.feedback=current.event.steps[current.step].result;current.step++;
      if(current.step===current.targets.length)current.phase='done';paint();return true;
    }
    function choose(index){if(!current||current.phase!=='choosing'||!Number.isInteger(index)||!current.event.choices[index])return false;var choice=current.event.choices[index];current.reply=choice.speaker+'：'+choice.reply;current.phase='reply';paint();return true;}
    return {
      mount:function(host){if(!host||!host.ownerDocument)return;var doc=host.ownerDocument,root=doc.createElement('section'),title=doc.createElement('h4'),copy=doc.createElement('p'),buttons=doc.createElement('div');root.className='story-interlude';root.hidden=true;root.setAttribute('aria-label','劇情互動');copy.setAttribute('aria-live','polite');buttons.className='story-interlude-actions';root.append(title,copy,buttons);host.appendChild(root);view={doc:doc,root:root,title:title,copy:copy,buttons:buttons};},
      reset:function(){current=null;seen={};lastActor=null;paint();},
      handled:function(key){return Boolean(seen[key]);},
      trigger:function(act,scene,text,key){
        if(seen[key]||current)return false;var event=match(act,scene,text);if(!event)return false;
        var origin=options.player(),path,targets=[];
        if(event.kind==='follow'){path=planNear(origin,180);if(!path.length)return false;}
        if(event.kind==='inspect'){for(var i=0;i<event.steps.length;i++){var planned=planNear(origin,52+i*24,i*2);if(!planned.length)return false;targets.push(planned[planned.length-1]);}}
        current={event:event,key:key,phase:event.kind==='choice'?'choosing':'exploring',path:path||[],targets:targets,step:0,feedback:''};
        if(event.kind==='follow')current.actor={id:event.actor,name:event.name,x:origin.x,y:origin.y,facing:'left',distance:0,walking:false,sceneMotion:true};
        options.suspend();paint();return true;
      },
      active:function(){return Boolean(current);},
      exploring:function(){return Boolean(current&&current.phase==='exploring');},
      actor:function(){return current&&current.actor||lastActor;},
      update:function(dt){
        if(!current||current.event.kind!=='follow'||!current.path.length)return;
        var actor=current.actor,player=options.player(),gap=Math.hypot(player.x-actor.x,player.y-actor.y);if(gap>112)current.waiting=true;if(gap<78)current.waiting=false;actor.walking=false;if(current.waiting)return;
        var allowance=Math.max(0,Math.min(dt,.05))*92;
        while(allowance>0&&current.path.length){var point=current.path[0],dx=point.x-actor.x,dy=point.y-actor.y,d=Math.hypot(dx,dy);if(d<.1){current.path.shift();continue;}var step=Math.min(allowance,d);actor.x+=dx/d*step;actor.y+=dy/d*step;actor.distance+=step;actor.facing=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';actor.walking=true;allowance-=step;if(step===d)current.path.shift();}
      },
      target:function(){if(!current||current.phase!=='exploring')return null;return current.event.kind==='follow'?current.actor:current.targets[current.step];},
      action:action,choose:choose,
      ui:function(){
        if(!current)return null;var e=current.event,p=options.player(),target=this.target(),distance=target?Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)):0;
        if(e.kind==='choice'||current.phase==='done')return {title:e.title,hint:current.phase==='choosing'?'選擇一句回應；主線將接回原劇情。':'回應後繼續交談。',button:'繼續交談 E',canAct:current.phase!=='choosing'};
        if(e.kind==='follow'){var arrived=!current.path.length;return {title:e.title,hint:arrived?'已到達，走近 '+e.name+' 繼續交談。':current.waiting?e.name+' 正在等你，跟上後繼續走。':e.hint,button:arrived?'與 '+e.name+' 交談 E':'跟上 '+e.name,canAct:arrived&&distance<=48,distance:distance};}
        return {title:e.title,hint:(current.step+1)+' / '+e.steps.length+' · '+(current.feedback?current.feedback+' ':'')+'走近亮起的位置。',button:e.steps[current.step].name+' E',canAct:distance<=46,distance:distance};
      }
    };
  }
  return {events:events,match:match,create:create};
}));
