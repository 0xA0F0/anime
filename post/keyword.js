document.addEventListener("DOMContentLoaded",function(){document.getElementById("commentInput").addEventListener("keydown",function(t){let n=document.getElementById("commentInput"),l=n.selectionStart,o=n.selectionEnd,s=n.value.substring(l,o);if(t.ctrlKey)switch(t.key){case"o":t.preventDefault(),e("[code=code]"+s+"[/code]");break;case"s":t.preventDefault(),e("[spoiler]"+s+"[/spoiler]");break;case"x":t.preventDefault(),e("[video]"+s+"[/video]")}});function e(e){let t=document.getElementById("commentInput"),n=t.selectionStart,l=t.selectionEnd,o=t.value.substring(0,n),s=t.value.substring(l,t.value.length);t.value=o+e+s,t.selectionStart=n+e.length,t.selectionEnd=n+e.length,t.focus()}});