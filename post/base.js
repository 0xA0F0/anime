let firebaseConfig = {
	apiKey: "AIzaSyDFLbXFdvOnuqmBQbaLlQl5H-T4wdjHTvM",
  authDomain: "vxwvxwvxwvxwvxwvxw.firebaseapp.com",
  databaseURL: "https://vxwvxwvxwvxwvxwvxw-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vxwvxwvxwvxwvxwvxw",
  storageBucket: "vxwvxwvxwvxwvxwvxw.appspot.com",
  messagingSenderId: "634499836834",
  appId: "1:634499836834:web:bd382166da1ddaf707a0fb",
  measurementId: "G-74DV8QY73V"
};
import {
	initializeApp as e
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
	getAnalytics as t
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import {
	getDatabase as n,
	ref as a,
	push as i,
	onValue as l,
	remove as s,
	update as o
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
let app = e(firebaseConfig),
	analytics = t(app),
	database = n(),
	commentForm = document.getElementById("commentForm"),
	commentInput = document.getElementById("commentInput"),
	commentsBlock = document.getElementById("commentsBlock"),
	loadMoreButton = document.createElement("span");
loadMoreButton.textContent = "Еще", loadMoreButton.classList.add("load-more-button"), document.querySelector(".main").insertBefore(loadMoreButton, commentsBlock);
let comments = [],
	commentLimit = 5;

	function displayComment(comment) {
		let commentDiv = document.createElement("div");
		commentDiv.id = `comment-${comment.key}`;
		commentDiv.classList.add("comment");
		commentDiv.setAttribute("data-key", comment.key);
	
		let controlsDiv = document.createElement("div");
		controlsDiv.classList.add("appear");
		if (!document.querySelector("form.login")) {
			let editButton = document.createElement("button");
			editButton.classList.add("edit-button", "mdi", "mdi-lead-pencil");
			editButton.addEventListener("click", () => displayEditForm(comment.key));
			controlsDiv.appendChild(editButton);
	
			let deleteButton = document.createElement("button");
			deleteButton.classList.add("delete", "mdi", "mdi-close");
			deleteButton.addEventListener("click", () => deleteComment(comment.key));
			controlsDiv.appendChild(deleteButton);
		}
		commentDiv.appendChild(controlsDiv);
	
		let avatar = document.createElement("img");
		avatar.classList.add("avatar");
		avatar.src = "ava.jpg";
		avatar.alt = "avatar";
		commentDiv.appendChild(avatar);
	
		let nicknameSpan = document.createElement("span");
		nicknameSpan.textContent = "null";
		nicknameSpan.classList.add("nickname");
		commentDiv.appendChild(nicknameSpan);
	
		let dateSpan = document.createElement("span");
		dateSpan.textContent = formatTimeDifference(comment.date);
		dateSpan.classList.add("date");
		commentDiv.appendChild(dateSpan);
	
		let contentDiv = document.createElement("div");
		contentDiv.classList.add("cmt");
		contentDiv.innerHTML = parseCommentText(comment.text);
		commentDiv.appendChild(contentDiv);
	
		if (comment.edited) {
			let editedSpan = document.createElement("span");
			editedSpan.classList.add("edited");
			let editedDate = new Date(comment.edited);
			editedSpan.innerHTML = `<span class="e-date">${editedDate.toLocaleString()}</span> <span class="mdi mdi-lead-pencil"></span>`;
			commentDiv.appendChild(editedSpan);
		}
	
		if (commentDiv.querySelectorAll("code").forEach(e => {
			hljs.highlightBlock(e)
		}), commentsBlock.appendChild(commentDiv), contentDiv.clientHeight > 200) {
			let moreTextDiv = document.createElement("div");
			moreTextDiv.innerHTML = '<span class="mdi mdi-arrow-down">развернуть</span>';
			moreTextDiv.addEventListener("click", () => {
				contentDiv.style.maxHeight = "none";
				moreTextDiv.style.display = "none";
			});
			moreTextDiv.classList.add("more-text");
			commentDiv.appendChild(moreTextDiv);
			contentDiv.style.maxHeight = "200px";
			contentDiv.style.overflow = "hidden";
		}
	}
	

	function editComment(e, t) {
		let n = a(database, `comments/${e}`);
		o(n, {
			text: t,
			edited: new Date().toISOString() // Используем ISO формат для сохранения
		});
	}

function displayEditForm(commentKey) {
	let commentDiv = document.getElementById(`comment-${commentKey}`);
	let originalText = comments.find(comment => comment.key === commentKey).text;
	let editForm = document.createElement("form");
	editForm.innerHTML = `
		<textarea rows="10" name="text" id="editCommentText" style="width: 100%; resize: block; overflow-wrap: break-word; padding: 5px; background: var(--edit-t); border-radius:3px;">${originalText}</textarea>
		<div class="b-edite">
			<button type="submit">Сохранить</button>
			<button type="button" class="cancelEdit">Отмена</button>
		</div>
	`;
	commentDiv.querySelectorAll(".comment > *").forEach(el => {
		el.style.display = "none";
	});
	commentDiv.appendChild(editForm);

	editForm.addEventListener("submit", function(event) {
		event.preventDefault();
		let editedText = editForm.querySelector("#editCommentText").value;
		editComment(commentKey, editedText);
		commentDiv.querySelector(".cmt").innerHTML = parseCommentText(editedText);
		editForm.remove();
		commentDiv.querySelectorAll(".comment > *").forEach(el => {
			el.style.display = "";
		});
	});

	editForm.querySelector(".cancelEdit").addEventListener("click", function() {
		editForm.remove();
		commentDiv.querySelectorAll(".comment > *").forEach(el => {
			el.style.display = "";
		});
	});
}


function displayComments() {
	commentsBlock.innerHTML = "", comments.slice(0, commentLimit).reverse().forEach(displayComment), commentLimit >= comments.length ? loadMoreButton.style.display = "none" : loadMoreButton.style.display = "inline"
}

function parseCommentText(e) {
	e = (e = e.replace(/\[span=([^\]]+)\]([\s\S]*?)\[\/span\]/g, '<span class="$1">$2</span>')).replace(/\[div=([^\]]+)\]([\s\S]*?)\[\/div\]/g, '<div class="$1">$2</div>');
	let t = [];
	return e = (e = (e = (e = (e = (e = (e = (e = (e = e.replace(/\[code=([a-zA-Z0-9\+\-\#]+)]([\s\S]*?)\[\/code]/g, function(e, n, a) {
		return n = n.replace("c++", "cpp"), a = (a = a.replace(/\[code=([a-zA-Z0-9\+\-\#]+)]([\s\S]*?)\[\/code]/g, function(e, t, n) {
			return "[code=" + t + "]" + n + "[/code]"
		})).replace(/</g, "&lt;").replace(/>/g, "&gt;"), t.push({
			lang: n,
			code: a
		}), "\x01" + (t.length - 1) + "\x01"
	})).replace(/\[hr\]/g, "<hr>")).replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div class="right">$1</div>')).replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div class="center">$1</div>')).replace(/\[img=([^\s]+)(?:\s+w=(\d+))?(?:\s+h=(\d+))?\]/g, function(e, t, n, a) {
		return n && a ? '<img src="' + t + '" alt="img" style="width: ' + n + "px; height: " + a + 'px;">' : '<img src="' + t + '" alt="img">'
	})).replace(/\[_list([\s\S]*?)\]/g, function(e, t) {
		var n = t.trim().split("\n"),
			a = '<ul class="list">';
		return n.forEach(function(e) {
			a += "<li>" + e.trim() + "</li>"
		}), a += "</ul>"
	})).replace(/\[spoiler=(.*?)\]([\s\S]*?)\[\/spoiler\]/g, function(e, t, n) {
		return '<div class="spoil"><div class="title">' + t + '</div><div class="content">' + n + "</div></div>"
	})).replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/g, '<a href="$1" target="_blank">$2</a>')).replace(/\[video\]([^\[]+)\[\/video\]/g, function(e, t) {
		var n = t.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)[1];
		return '<div class="video-container"><img src="https://img.youtube.com/vi/' + n + '/maxresdefault.jpg" class="preview-img" /><iframe src="https://www.youtube.com/embed/' + n + '" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display:none;"></iframe></div>'
	}), document.addEventListener("click", function(e) {
		var t = e.target;
		t.classList.contains("video-container") && (t.querySelector(".preview-img").style.display = "none", t.querySelector("iframe").style.display = "block", t.classList.add("off"))
	}), document.querySelector(".comments") && document.getElementById("preview").addEventListener("click", function(e) {
		var t = e.target;
		t.classList.contains("video-container") && (t.querySelector(".preview-img").style.display = "none", t.querySelector("iframe").style.display = "block", t.classList.add("off"))
	}), e = (e = e.replace(/\n/g, "<br>")).replace(/\x01(\d+)\x01/g, function(e, n) {
		let a = t[n];
		return '<pre  id="code"class="this-code flex column"><div class="code-itm"><span class="lang">' + a.lang + '</span></div> <code class="kod language-' + a.lang + '">' + a.code.trim() + "</code></pre>"
	})
}
document.addEventListener("click", function(e) {
	var t = e.target,
		n = t.closest(".title"),
		a = t.closest("#preview");
	n && !a && n.classList.toggle("jez")
}), document.getElementById("preview").addEventListener("click", function(e) {
	var t = e.target.closest(".title");
	t && t.classList.toggle("jez")
});
let isPreviewVisible = !1;

function deleteComment(e) {
	let t = a(database, `comments/${e}`);
	s(t)
}

function formatTimeDifference(e) {
	let t = Math.floor((new Date - new Date(e)) / 1e3),
		n = Math.floor(t / 60),
		a = Math.floor(n / 60),
		i = Math.floor(a / 24),
		l = Math.floor(i / 7),
		s = Math.floor(i / 30),
		o = Math.floor(i / 365);
	return o > 0 ? 1 === o ? "год назад" : `${o} ${o%10==2||o%10==3||o%10==4?"года":"лет"} назад` : s > 0 ? 1 === s ? "месяц назад" : `${s} ${s%10==1?"месяц":"месяца"} назад` : l > 0 ? 1 === l ? "неделю назад" : `${l} ${l%10==1?"неделю":"недели"} назад` : i > 0 ? 1 === i ? "вчера" : `${i} ${i%10==1?"день":"дня"} назад` : a > 0 ? 1 === a ? "час назад" : `${a} ${a%10==1?"час":"часа"} назад` : n > 0 ? 1 === n ? "минуту назад" : `${n} ${n%10==1?"минуту":"минуты"} назад` : t > 0 ? 1 === t ? "секунду назад" : `${t} ${t%10==1?"секунду":"секунды"} назад` : "только что"
}

function sendComment(e) {
	if ("" !== e.text.trim()) {
		a(database, "comments");
		let t = {
				text: e.text,
				date: new Date().toISOString()
			},
			n = a(database, `comments/${Date.now().toString()}`);
		o(n, t)
	}
}
document.getElementById("b-preview").addEventListener("click", function() {
    let e = document.getElementById("commentInput"),
        t = document.getElementById("preview");
    if (isPreviewVisible) {
        e.style.display = "block";
        t.style.display = "none";
        isPreviewVisible = !1;
    } else {
        let n = parseCommentText(e.value);
        t.innerHTML = n;
        e.style.display = "none";
        t.style.display = "block";
        isPreviewVisible = !0;

        // Добавляем подсветку синтаксиса
        t.querySelectorAll("pre code").forEach((block) => {
            hljs.highlightElement(block);
        });
	}
}), loadMoreButton.addEventListener("click", () => {
	commentLimit += 10, displayComments()
});
let notificationSound = new Audio("notification.mp3"),
	userInteracted = !1;

function handleUserInteraction() {
	userInteracted = !0, document.removeEventListener("click", handleUserInteraction), document.removeEventListener("keydown", handleUserInteraction)
}
document.addEventListener("click", handleUserInteraction), document.addEventListener("keydown", handleUserInteraction), l(a(database, "comments"), e => {
	let t = [];
	e.forEach(e => {
		let n = new Date(e.val().date),
			a = {
				key: e.key,
				text: e.val().text,
				date: n,
				edited: e.val().edited
			};
		t.push(a)
	}), t.reverse(), t.length > comments.length && userInteracted && notificationSound.play().catch(e => {
		console.error("Ошибка воспроизведения звука:", e)
	}), comments = t, displayComments()
}), commentForm.addEventListener("submit", e => {
	e.preventDefault();
	let t = commentInput.value.trim();
	if ("" !== t) sendComment({
		text: t
	}), commentInput.value = "";
	else {
		let n = document.createElement("span");
		n.className = "error", n.textContent = "текст не может быть пустым", commentForm.appendChild(n), setTimeout(() => {
			n.remove()
		}, 3e3)
	}
});
let searchInput = document.getElementById("searchInput");

function displayFilteredComments(e) {
	let t = comments.filter(t => {
		let n = RegExp(e, "i");
		return n.test(t.text.toLowerCase()) || n.test(t.key)
	});
	commentsBlock.innerHTML = "", t.slice(0, commentLimit).forEach(displayComment), commentLimit >= t.length ? loadMoreButton.style.display = "none" : loadMoreButton.style.display = "inline"
}
searchInput.addEventListener("input", function() {
	let e = searchInput.value.toLowerCase();
	"" === e ? displayComments() : displayFilteredComments(e)
});


(function() {
    'use strict';

   const textarea = document.getElementById('commentInput');
function autoResize() {
        textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}
textarea.addEventListener('input', autoResize);

autoResize();
})();