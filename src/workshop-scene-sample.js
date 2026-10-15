(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipWorkshopSceneSample=api;}(globalThis,function(){
  'use strict';
  function install(world){
    world.maps.cityWorkshopSample={name:'白鐘城・工坊街區樣板',width:1536,height:1024,image:'./assets/exploration/workshop-street-playable-sample-v1.png',spawn:[900,620],
      paths:[{width:62,points:[[40,577],[200,610],[400,651],[600,690],[800,729],[1000,766],[1200,803],[1430,842]]},{width:42,points:[[220,612],[300,540],[355,470],[400,400],[430,330],[440,260],[440,180],[410,80],[370,30]]},{width:75,points:[[740,600],[880,560],[970,560]]},{width:60,points:[[900,748],[900,620],[920,520],[920,455]]},{width:28,points:[[450,660],[470,720],[450,770],[430,810],[410,850]]}],
      buildings:[{x:575,y:30,w:690,h:390},{x:430,y:260,w:330,h:300}],sites:[{id:'crane',name:'工坊卸貨前院',x:800,y:600,text:'吊架與工具留在道路外，中央石路通向工坊門口。'},{id:'quay',name:'沿河石街',x:1150,y:794,text:'沿石街行走，欄杆與河面不屬於通路。'}],
      exits:[{name:'進入老瓦克工坊',x:920,y:455,to:'workshopSampleInside',spawn:[480,630]}]};
    world.maps.workshopSampleInside={name:'老瓦克工坊・室內樣板',width:960,height:720,image:'./assets/exploration/journey-inn-interior-v1.png',spawn:[480,630],floor:[64,64,896,656],paths:[],
      furniture:[{sprite:4,x:320,y:110,w:190,h:145},{sprite:7,x:650,y:110,w:160,h:150},{sprite:6,x:110,y:100,w:140,h:190}],sites:[{id:'bench',name:'工作臺',x:450,y:330,text:'工作臺旁保留通道，門口通回工坊前院。'}],exits:[{name:'返回工坊前院',x:480,y:630,to:'cityWorkshopSample',spawn:[920,520]}]};
    return {map:'cityWorkshopSample',starts:{'工坊前院':[900,620],'沿河石街':[1150,794],'西側小巷':[355,470],'河岸階梯前':[450,770]}};
  }
  return {install:install};
}));
