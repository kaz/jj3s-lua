"use strict";

const constantFolding = tree => {
	const scanTree = t => {
		if(t.type == "NumericLiteral"){
			return t.value;
		}
		if(t.type == "UnaryExpression"){
			const a = scanTree(t.argument);
			if(a === null){
				return null;
			}
			if(t.operator == "~"){
				return ~a;
			}
			if(t.operator == "-"){
				return -a;
			}
			if(t.operator == "not"){
				return a ? 0 : 1;
			}
		}
		if(t.type == "BinaryExpression"){
			const [r,l] = [scanTree(t.right), scanTree(t.left)];
			if(t.operator == "and" && r !== null && !r){
				return 0;
			}
			if(t.operator == "or" && r !== null && r){
				return 1;
			}
			if(r === null || l === null){
				return null;
			}
			if(t.operator == "and"){
				return r&&l ? 1 : 0;
			}
			if(t.operator == "or"){
				return r||l ? 1 : 0;
			}
			if(t.operator == "=="){
				return r==l ? 1 : 0;
			}
			if(t.operator == "~="){
				return r!=l ? 1 : 0;
			}
			if(t.operator == "<"){
				return r<l ? 1 : 0;
			}
			if(t.operator == "<="){
				return r<=l ? 1 : 0;
			}
			if(t.operator == ">="){
				return r>=l ? 1 : 0;
			}
			if(t.operator == ">"){
				return r>l ? 1 : 0;
			}
			if(t.operator == "+"){
				return r+l;
			}
			if(t.operator == "|"){
				return r|l;
			}
			if(t.operator == "-"){
				return r-l;
			}
			if(t.operator == "*"){
				return r*l;
			}
			if(t.operator == "/" || t.operator == "//"){
				return parseInt(r/l);
			}
			if(t.operator == "%"){
				return r%l;
			}
			if(t.operator == "&"){
				return r&l;
			}
			if(t.operator == ">>"){
				return r>>l;
			}
			if(t.operator == "<<"){
				return r<<l;
			}
		}
		return null;
	};
	const fixTree = t => {
		if(typeof t != "object"){
			return t;
		}
		for(let k in t){
			const v = scanTree(t[k]);
			t[k] = (v === null) ? fixTree(t[k]) : {
				"type": "NumericLiteral",
				"value": v,
				"raw": ""+v,
			};
		}
		return t;
	};
	return fixTree(tree);
};

const optimizeTree = tree => {
	// 定数の畳み込み
	tree = constantFolding(tree);
	return tree;
};

const optimizeCode = code => {
	const __optimize = t => {
		const newt = [];
		for(let i = 0; i < t.length; i++){
			// 無駄なPUSH/POPを削除
			if(t[i] == "BSA F_PUSH" && t[i+1] == "BSA F_POP"){
				i++;
				continue;
			}
			if(t[i] == "BSA F_POP" && t[i+1] == "BSA F_PUSH"){
				i++;
				continue;
			}
			
			// 無駄なLDA/STAを削除
			const cm = t[i].match(new RegExp("^(LDA|STA) (.+)$"));
			if(cm){
				const nm = (t[i+1] || "").match(new RegExp("^(LDA|STA) "+cm[2]+"$"));
				if(nm){
					if(cm[1] == "LDA" && nm[1] == "STA"){
						i++;
						continue;
					}
					if(cm[1] == "STA" && nm[1] == "LDA"){
						newt.push(t[i++]);
						continue;
					}
				}
			}
			
			newt.push(t[i]);
		}
		return newt;
	};
	
	// 最大まで最適化
	let len;
	do {
		len = code.length;
		code = __optimize(code);
	}while(len - code.length);
	
	return code;
};

module.exports = {optimizeTree, optimizeCode};