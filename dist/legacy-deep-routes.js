const routes={"practice-route": "practice.html#start", "ticket-practice": "practice.html#ticket-practice", "chat-task": "practice.html#chat-task", "qoder": "practice.html#qoder", "create": "practice.html#create", "install-skill": "practice.html#install-skill", "new-chat": "practice.html#new-chat", "practice": "practice.html#practice", "advanced": "advanced.html#start", "verification-prep": "advanced.html#verification-prep", "regression-plan": "advanced.html#regression-plan", "verification-files": "advanced.html#verification-files", "verification-run": "advanced.html#verification-run", "evals-use": "advanced.html#evals-use", "eval-review": "advanced.html#eval-review", "regression": "advanced.html#regression", "migration": "advanced.html#migration", "reference-skill": "advanced.html#reference-skill", "feedback": "advanced.html#feedback", "feedback-prompt": "advanced.html#feedback-prompt"};
function routeLegacy(){
 let key;try{key=decodeURIComponent(location.hash.slice(1));}catch{return;}
 const target=routes[key];
 if(Object.hasOwn(routes,key))location.replace(new URL(target,location.href).href);
}
routeLegacy();addEventListener("hashchange",routeLegacy);
