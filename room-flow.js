export const quickMessages=['监管者在我附近！','我去救人！','专心破译！','跟我来！','大门已开启！'];
export function preparationRemaining(deadline,now=Date.now()){return Math.max(0,Math.ceil((deadline-now)/1000));}
export function resetPreparation(room){room.phase='seats';room.deadline=0;for(const p of room.players)p.ready=false;}
