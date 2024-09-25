import {
	initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
	getDatabase,
	ref,
	get,
	child,
	set,
	push,
	onValue,
	remove
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import {
	getStorage,
	ref as storageRef,
	uploadBytes,
	getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = {
	apiKey: "AIzaSyDFLbXFdvOnuqmBQbaLlQl5H-T4wdjHTvM",
	authDomain: "vxwvxwvxwvxwvxwvxw.firebaseapp.com",
	databaseURL: "https://vxwvxwvxwvxwvxwvxw-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "vxwvxwvxwvxwvxwvxw",
	storageBucket: "vxwvxwvxwvxwvxwvxw.appspot.com",
	messagingSenderId: "634499836834",
	appId: "1:634499836834:web:bd382166da1ddaf707a0fb",
	measurementId: "G-74DV8QY73V"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

if (window.location.search === 'chat/?reg') {
	createRegistrationForm();
} else if (localStorage.getItem('loggedIn') === 'true') {
	createInSysteme();
} else {
	createLoginForm();
}

function createLoginForm() {
	const loginForm = document.createElement("div");
	loginForm.className = "login";
	loginForm.innerHTML = `
        <input size="25" type="text" id="user" placeholder="ник">
        <input size="25" type="password" id="password" placeholder="пароль">
        <button id="login" type="button">Войти</button>
        <button id="register" type="button">Зарегистрироваться</button>
    `;
	document.body.appendChild(loginForm);

	document.getElementById("login").addEventListener("click", function() {
		loginUser();
	});

	document.getElementById("register").addEventListener("click", function() {
		window.location.href = "chat/?reg";
	});

	document.getElementById("password").addEventListener("keydown", function(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			document.getElementById("login").click();
		}
	});
}

function showMessage(message, type) {
	const messageElement = document.getElementById('message');

	if (messageElement) {
		messageElement.textContent = message;
		messageElement.className = type;
		localStorage.setItem('message', JSON.stringify({
			message,
			type
		}));

		setTimeout(() => {
			localStorage.removeItem('message');
			messageElement.textContent = '';
			messageElement.className = '';
		}, 3000);
	}
}

function displayStoredMessage() {
	const messageData = JSON.parse(localStorage.getItem('message'));
	if (messageData) {
		showMessage(messageData.message, messageData.type);
	}
}

window.addEventListener('load', displayStoredMessage);







function loginUser() {
	const user = document.getElementById("user").value;
	const password = document.getElementById("password").value;

	const userRef = ref(db, `users/${user}`);
	get(userRef).then((snapshot) => {
		if (snapshot.exists()) {
			const userData = snapshot.val();
			if (password === userData.password) {
				localStorage.setItem('loggedIn', 'true');
				localStorage.setItem('currentUser', user);
				document.querySelector('.login').remove();
				createInSysteme();
				showMessage("Ты в системе", "success");
			} else {
				showMessage("Неправильный логин или пароль", "error");
			}
		} else {
			showMessage("Пользователь не найден", "error");
		}
	}).catch((error) => {
		console.error("Ошибка: ");
	});
}

function createRegistrationForm() {
	const loginForm = document.querySelector(".login");
	if (loginForm) {
		loginForm.remove();
	}

	const regForm = document.createElement("div");
	regForm.className = "registration";
	regForm.style = "max-width: 200px;"
	regForm.innerHTML = `
<p style="color:dimgray;font-size: 10px;margin-bottom: 5px;"> Перетащите изображение сюда или нажмите на аватар для выбора аватара</p>        <div id="avatarContainer" style="margin-bottom: 10px; width: 90px; height: 90px; background-image: url('https://placehold.co/90x90?text=Avatar'); background-size: cover; background-position: center;align-self: center; border-radius: 100%; cursor: pointer;"></div>
        <input type="file" id="avatar" accept="image/*" style="display:none;">
        <input size="25" type="text" id="newUser" placeholder="ник">
        <input size="25" type="password" id="newPassword" placeholder="пароль">
        <button id="registerUser" type="submit">Создать</button>
        <button id="back" type="button">Залогиниться</button>
    `;
	document.body.appendChild(regForm);

	const avatarInput = document.getElementById("avatar");
	const avatarContainer = document.getElementById("avatarContainer");
	const registerUserButton = document.getElementById("registerUser");
	const backButton = document.getElementById("back");

	avatarContainer.addEventListener("click", function() {
		avatarInput.click();
	});

	avatarInput.addEventListener("change", function(event) {
		const file = event.target.files[0];
		if (file) {
			handleAvatarUpload(file);
		}
	});

	avatarContainer.addEventListener("dragover", function(event) {
		event.preventDefault();
		avatarContainer.style.border = "2px dashed green";
	});

    avatarContainer.addEventListener("dragleave", function(event) {
		avatarContainer.style.border = "2px dashed transparent";
	});


	avatarContainer.addEventListener("drop", function(event) {
		event.preventDefault();
        avatarContainer.style.border = "2px dashed transparent";
		const files = event.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			if (file.type.startsWith("image/")) {
				avatarInput.files = files;
				handleAvatarUpload(file);
			} else {
				alert("Пожалуйста, выберите изображение.");
			}
		}
	});

	registerUserButton.addEventListener("click", function() {
		registerNewUser();
	});

	backButton.addEventListener("click", function() {
		window.location.href = '/';
	});
}




let selectedAvatarUrl = '';

function registerNewUser() {
	const user = document.getElementById("newUser").value.trim();
	const password = document.getElementById("newPassword").value.trim();

	if (user === '' || password === '') {
		showMessage("Пожалуйста, введите логин и пароль.", "error");
		return;
	}

	if (password.length < 6) {
		showMessage("Пароль должен содержать минимум 6 символов.", "error");
		return;
	}

	const usersRef = ref(db, 'users');
	get(usersRef).then((snapshot) => {
		if (snapshot.exists()) {
			let userExists = false;

			snapshot.forEach((childSnapshot) => {
				const existingUser = childSnapshot.key;
				if (existingUser.toLowerCase().includes(user.toLowerCase())) {
					userExists = true;
					return true;
				}
			});

			if (userExists) {
				showMessage("Такой юзер уже существует.", "error");
				return;
			}

			const userRef = ref(db, `users/${user}`);
			const userData = {
				password: password,
				avatar: selectedAvatarUrl || ''
			};

			set(userRef, userData)
				.then(() => {
					showMessage("Регистрация прошла успешно!", "success");
					localStorage.setItem('loggedIn', 'true');
					localStorage.setItem('currentUser', user);
					window.location.href = "/";
				})
				.catch((error) => {
					console.error("Ошибка при регистрации пользователя:", error.message);
					showMessage("Произошла ошибка при регистрации пользователя. Пожалуйста, попробуйте позже.", "error");
				});
		} else {
			const userRef = ref(db, `users/${user}`);
			const userData = {
				password: password,
				avatar: selectedAvatarUrl || ''
			};

			set(userRef, userData)
				.then(() => {
					showMessage("Регистрация прошла успешно!", "success");
					localStorage.setItem('loggedIn', 'true');
					localStorage.setItem('currentUser', user);
					window.location.href = "/";
				})
				.catch((error) => {
					console.error("Ошибка при регистрации пользователя:", error.message);
					showMessage("Произошла ошибка при регистрации пользователя. Пожалуйста, попробуйте позже.", "error");
				});
		}
	}).catch((error) => {
		console.error("Ошибка при проверке имени пользователя:", error.message);
		showMessage("Произошла ошибка при проверке имени пользователя. Пожалуйста, попробуйте позже.", "error");
	});
}
async function handleAvatarUpload(file) {
	const formData = new FormData();
	formData.append("image", file);

	try {
		const response = await fetch(`https://api.imgbb.com/1/upload?key=45fd6a42c90f6c423142b91e591b910a`, {
			method: "POST",
			body: formData,
		});
		const data = await response.json();
		if (data.success) {
			selectedAvatarUrl = data.data.url;
			document.getElementById("avatarContainer").style.backgroundImage = `url('${selectedAvatarUrl}')`;
			showMessage('Аватарка загружена успешно!', "success");
		} else {
			showMessage("Ошибка при загрузке аватарки.", "error");
		}
	} catch (error) {
		console.error("Ошибка при загрузке аватарки: ", error);
	}
}

document.getElementById("delete-account").addEventListener("click", async function() {
	const currentUser = localStorage.getItem('currentUser');
	if (confirm("Вы уверены, что хотите удалить аккаунт? Все ваши данные будут удалены безвозвратно.")) {
		await deleteUserPosts(currentUser);
		await deleteUserAccount(currentUser);
		localStorage.removeItem('loggedIn');
		localStorage.removeItem('currentUser');
		document.querySelector(".in-systeme").remove();
		createLoginForm();
		showMessage("Аккаунт и все посты успешно удалены.", "success");
	}
});

async function deleteUserPosts(user) {
	const postsRef = ref(db, 'posts');
	get(postsRef).then((snapshot) => {
		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				const postId = childSnapshot.key;
				const postData = childSnapshot.val();
				if (postData.user === user) {
					remove(ref(db, `posts/${postId}`));
				}
			});
		}
	}).catch((error) => {
		console.error("Ошибка при удалении постов пользователя:", error);
	});
}

async function deleteUserAccount(user) {
	const userRef = ref(db, `users/${user}`);
	remove(userRef).catch((error) => {
		console.error("Ошибка при удалении аккаунта пользователя:", error);
	});
}


window.insertBBCode = function(code) {
	const textarea = document.getElementById('editable');
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;

	textarea.value = text.slice(0, start) + code + text.slice(end);
	textarea.selectionStart = textarea.selectionEnd = start + code.length;
	textarea.focus();
};


function createInSysteme() {
	const inSysteme = document.createElement("div");
	inSysteme.className = "in-systeme";
	inSysteme.innerHTML = `
    <div class="setting" style="float: left; margin-top: 10px;">
        <button class="mdi mdi-cog-outline hzp"></button>
        <button id="delete-account"> Удалить аккаунт </button>
        <input type="file" id="changeava" accept="image/*" style="display:none;">
        <button id="updav" type="button"> Поменять аву</button>
    </div>
    <button id="logout" class="mdi mdi-logout-variant" style="margin-top: 10px; margin-bottom: 10px; float:right; font-size:17px;"></button>
    <div id="posts" class="posts"></div>
    <div id="editor">
    <div style="display: flex; gap: 2px;">    
    <textarea placeholder="..." name="post" rows="3" id="editable" class="editable"></textarea>
    <button id="send" class="mdi mdi-send" type="submit" style="float:right; font-size:17px; "></button>
</div>
        <div style="margin-top:10px;display: flex;gap: 5px;">
            <div class="toolbar"style="display: flex; flex-wrap: wrap; gap: 3px;">
                        <input type="file" id="file" style="display:none;" multiple>
            <button id="upload" class="mdi mdi-file-upload" type="button" style="font-size:15px"></button>
    <button onclick="insertBBCode('[b]текст[/b]')" class="mdi mdi-format-bold"><span>Жирный</span></button>
    <button onclick="insertBBCode('[i]текст[/i]')" class="mdi mdi-format-italic"><span>Курсив</span></button>
    <button onclick="insertBBCode('[u]текст[/u]')" class="mdi mdi-format-underline"><span>Подчеркнутый</span></button>
    <button onclick="insertBBCode('[s]текст[/s]')" class="mdi mdi-format-strikethrough"><span>Зачеркнутый</span></button>
    <button onclick="insertBBCode('[color=red]текст[/color]')" class="mdi mdi-format-color-text"><span>Цвет</span></button>
    <button onclick="insertBBCode('[url=https://example.com]текст[/url]')" class="mdi mdi-link"><span>Ссылка</span></button>
    <button onclick="insertBBCode('[q]текст[/q]')" class="mdi mdi-format-quote-close"><span>Цитата</span></button>
    <button onclick="insertBBCode('[code]code[/code]')" class="mdi mdi-code-tags"><span>Код</span></button>
    <button onclick="insertBBCode('[h1]заголовок[/h1]')" class="mdi mdi-format-header-1"><span>Заголовок 1</span></button>
    <button onclick="insertBBCode('[h2]заголовок[/h2]')" class="mdi mdi-format-header-2"><span>Заголовок 2</span></button>
    <button onclick="insertBBCode('[h3]заголовок[/h3]')" class="mdi mdi-format-header-3"><span>Заголовок 3</span></button>
    <button onclick="insertBBCode('[h4]заголовок[/h4]')" class="mdi mdi-format-header-4"><span>Заголовок 4</span></button>
    <button onclick="insertBBCode('[h5]заголовок[/h5]')" class="mdi mdi-format-header-5"><span>Заголовок 5</span></button>
    <button onclick="insertBBCode('[h6]заголовок[/h6]')" class="mdi mdi-format-header-6"><span>Заголовок 6</span></button>
    <button onclick="insertBBCode('[center]центр[/center]')" class="mdi mdi-format-align-center"><span>По центру</span></button>
    <button onclick="insertBBCode('[right]справа[/right]')" class="mdi mdi-format-align-right"><span>Справа</span></button>
    <button onclick="insertBBCode('[br]')" class="mdi mdi-format-line-spacing"><span>Перенос</span></button>
    <button onclick="insertBBCode('[hr]')" class="mdi mdi-minus"><span>Горизонтальная линия</span></button>
    <button onclick="insertBBCode('[v]https://youtube.com/watch?v=ID[/v]')" class="mdi mdi-youtube"><span>YouTube</span></button>
    <button onclick="insertBBCode('[kbd]CTRL[/kbd]')" class="mdi mdi-keyboard"><span>Клавиши</span></button>
    <button onclick="insertBBCode('[s=спойлер]содержимое[/s]')" class="mdi mdi-bullhorn"><span>Спойлер</span></button>
</div>
        </div>

    </div>
`;


	document.body.appendChild(inSysteme);

	loadPosts();

	document.getElementById("upload").addEventListener("click", function() {
		document.getElementById("file").click();
	});

	document.getElementById("file").addEventListener("change", function(event) {
		const file = event.target.files[0];
		if (file) {
			handlefile(file);
		}
	});

	document.getElementById("updav").addEventListener("click", function() {
		document.getElementById("changeava").click();
	});

	document.getElementById("changeava").addEventListener("change", function(event) {
		const file = event.target.files[0];
		if (file) {
			handleAvatarChange(file);
		}
	});

	document.getElementById("send").addEventListener("click", function() {
		const postText = document.getElementById("editable").value;
		if (postText.trim()) {
			addPostToDatabase(postText);
			document.getElementById("editable").value = '';
		} else {
			showMessage("Введите текст!", "error");
		}
	});

	document.getElementById("logout").addEventListener("click", function() {
		localStorage.removeItem('loggedIn');
		localStorage.removeItem('currentUser');
		document.querySelector(".in-systeme").remove();
		createLoginForm();
		showMessage("Ты вне системы", "success");
	});
}

function handlefile(file) {
	if (file.type.startsWith('image/')) {
		uploadImg(file);
	} else {
		uploadFileToFirebase(file);
	}
}

function handleAvatarChange(file) {
	const formData = new FormData();
	formData.append("image", file);

	fetch(`https://api.imgbb.com/1/upload?key=45fd6a42c90f6c423142b91e591b910a`, {
			method: "POST",
			body: formData,
		})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				const avatarUrl = data.data.url;
				updateAvatarInDatabase(avatarUrl);
				showMessage('Аватарка изменена успешно, обновите страницу!', "success");
			} else {
				showMessage("Ошибка при изменении аватарки.", "error");
			}
		})
		.catch((error) => {
			console.error("Ошибка при изменении аватарки: ");
		});
}

function updateAvatarInDatabase(avatarUrl) {
	const currentUser = localStorage.getItem('currentUser');
	const userRef = ref(db, `users/${currentUser}/avatar`);

	set(userRef, avatarUrl).catch((error) => {
		console.error("Ошибка при обновлении аватарки в базе данных: ");
	});
}

function uploadImg(file) {
	const formData = new FormData();
	formData.append("image", file);

	fetch(`https://api.imgbb.com/1/upload?key=45fd6a42c90f6c423142b91e591b910a`, {
			method: "POST",
			body: formData,
		})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				const imageUrl = data.data.url;
				img(imageUrl);
				showMessage("Загружено", "success");
			} else {
				showMessage("Ошибка при загрузке изображения.", "error");
			}
		})
		.catch((error) => {
			console.error("Ошибка при загрузке изображения: ");
		});
}

function img(imageUrl) {
	const textarea = document.getElementById("editable");
	const image = `[img]${imageUrl}[/img]`;
	textarea.value += `${image}`;
}

function uploadFileToFirebase(file) {
	const fileRef = storageRef(storage, 'files/' + file.name);

	uploadBytes(fileRef, file).then((snapshot) => {
		console.log('Uploaded a file!');
		getDownloadURL(fileRef).then((url) => {
			const fileLink = `[a=${url}]${file.name}[/a]`;
			const textarea = document.getElementById("editable");
			textarea.value += `${fileLink}\n`;
		}).catch((error) => {
			console.error("Ошибка при получении URL: ");
		});
	}).catch((error) => {
		console.error("Ошибка при загрузке файла: ");
	});
}


async function generateNewPostId() {
	const postsRef = ref(db, 'posts');
	const snapshot = await get(postsRef);

	let newId = 100;
	if (snapshot.exists()) {
		snapshot.forEach(childSnapshot => {
			const postId = parseInt(childSnapshot.key, 10);
			if (postId >= newId) {
				newId = postId + 1;
			}
		});
	}
	return newId.toString();
}

async function getUserIp() {
	const response = await fetch('https://api.ipify.org?format=json');
	const data = await response.json();
	return data.ip;
}

async function addPostToDatabase(postText) {
	try {
		const newPostId = await generateNewPostId();
		const postsRef = ref(db, `posts/${newPostId}`);
		const currentUser = localStorage.getItem('currentUser');
		const currentDate = new Date().toISOString();

		const postData = {
			text: postText,
			user: currentUser,
			date: currentDate
		};

		if (currentUser !== 'admin') {
			const userIp = await getUserIp();
			postData.ip = userIp;
		}

		await set(postsRef, postData);

		loadPosts();
	} catch (error) {
		console.error("Ошибка при добавлении поста:", error);
	}
}




function formatTimeDifference(e) {
	let t = Math.floor((new Date() - new Date(e)) / 1000),
		n = Math.floor(t / 60),
		a = Math.floor(n / 60),
		i = Math.floor(a / 24),
		l = Math.floor(i / 7),
		s = Math.floor(i / 30),
		o = Math.floor(i / 365);

	return o > 0 ? 1 === o ? "год назад" : `${o} ${o % 10 == 2 || o % 10 == 3 || o % 10 == 4 ? "года" : "лет"} назад` :
		s > 0 ? 1 === s ? "месяц назад" : `${s} ${s % 10 == 1 ? "месяц" : "месяца"} назад` :
		l > 0 ? 1 === l ? "неделю назад" : `${l} ${l % 10 == 1 ? "неделю" : "недели"} назад` :
		i > 0 ? 1 === i ? "вчера" : `${i} ${i % 10 == 1 ? "день" : "дня"} назад` :
		a > 0 ? 1 === a ? "час назад" : `${a} ${a % 10 == 1 ? "час" : "часа"} назад` :
		n > 0 ? 1 === n ? "минуту назад" : `${n} ${n % 10 == 1 ? "минуту" : "минуты"} назад` :
		t > 0 ? 1 === t ? "секунду назад" : `${t} ${t % 10 == 1 ? "секунду" : "секунды"} назад` :
		"только что";
}


function loadPosts() {
	console.log('loadPosts вызвана');

	const postsRef = ref(db, 'posts');
	const postsContainer = document.getElementById("posts");
	postsContainer.innerHTML = '';

	get(postsRef).then((snapshot) => {
		console.log('get сработал');
		postsContainer.innerHTML = '';

		let postIdToShow = null;
		if (window.location.hash.startsWith("#post-")) {
			postIdToShow = window.location.hash.split("-")[1];
		}

		snapshot.forEach((childSnapshot) => {
			const postData = childSnapshot.val();
			const postId = childSnapshot.key;

			const userRef = ref(db, `users/${postData.user}`);
			get(userRef).then((userSnapshot) => {
				const userData = userSnapshot.val();
				const username = postData.user ? postData.user : "Неизвестный пользователь";
				const avatar = userData.avatar ? userData.avatar : "https://placehold.co/34?text=?";
				const date = postData.date ? formatTimeDifference(postData.date) : "Дата не указана";

				const postDiv = document.createElement("div");
				postDiv.className = "post";
				postDiv.dataset.postId = postId;

				postDiv.innerHTML = `
                    <div class="user">
                        <div class="control">
                            ${localStorage.getItem('currentUser') === postData.user || localStorage.getItem('currentUser') === 'admin' ? 
                                `<span class="edit mdi mdi-lead-pencil" data-id="${postId}"></span>` : ''}
                            ${localStorage.getItem('currentUser') === postData.user || localStorage.getItem('currentUser') === 'admin' ? 
                                `<span class="delete mdi mdi-trash-can" data-id="${postId}"></span>` : ''}
                            <span class="reply mdi mdi-reply" data-id="${postId}" data-username="${username}"></span>
                        </div>
                        <div class="info">
                            <img src="${avatar}" style="--ava:34px;width:var(--ava); height:var(--ava);float:left;border-radius:50%;box-shadow: 0px 0px 0px 3px var(--bg);" alt="avatar">
                            <strong>${username}</strong>
                            <small>${date}</small>
                        </div>
                        <div class="content">
                            ${parseTextToHtml(postData.text)}
                        </div>
                    </div>
                `;

				if (postIdToShow && postIdToShow === postId) {
					postsContainer.appendChild(postDiv);
				} else if (!postIdToShow) {
					postsContainer.appendChild(postDiv);
				}

				postDiv.querySelector('.reply').addEventListener('click', (event) => {
					const postId = event.target.getAttribute('data-id');
					const username = event.target.getAttribute('data-username');
					const replyText = `[a=#post-${postId}]@${username}[/a], `;
					document.getElementById('editable').value = replyText;
				});
				document.querySelectorAll('.edit').forEach(editBtn => {
					editBtn.addEventListener('click', (event) => {
						const postId = event.target.getAttribute('data-id');
						enableEditing(postId);
					});
				});

				document.querySelectorAll('.delete').forEach(deleteBtn => {
					deleteBtn.addEventListener('click', (event) => {
						const postId = event.target.getAttribute('data-id');
						deletePost(postId);
					});
				});
			}).catch((error) => {
				console.error("Ошибка при получении данных пользователя: ", error);
			});
		});
	}).catch((error) => {
		console.error("Ошибка при загрузке постов: ", error);
	});
}




function disableEditing(postDiv) {
	const textarea = postDiv.querySelector(".edit-textarea");
	const newText = textarea.value;
	const contentDiv = postDiv.querySelector(".content");

	contentDiv.innerHTML = parseTextToHtml(newText);
}

function enableEditing(postId) {
	const postDiv = document.querySelector(`.post [data-id='${postId}']`).closest(".post");
	if (!postDiv) {
		console.error("Не удалось найти элемент поста.");
		return;
	}

	const contentDiv = postDiv.querySelector(".content");
	if (!contentDiv) {
		console.error("Не удалось найти элемент содержимого поста.");
		return;
	}

	const postRef = ref(db, `posts/${postId}`);
	get(postRef).then((snapshot) => {
		if (snapshot.exists()) {
			const originalText = snapshot.val().text;

			contentDiv.innerHTML = `
                <textarea class="edit-textarea" style="width:99%;">${originalText}</textarea>
                <button id="save" class="mdi mdi-check" type="button" style="margin-top:5px;float: right;"></button>
            `;

			const textarea = postDiv.querySelector(".edit-textarea");
			const saveButton = postDiv.querySelector("#save");
			if (saveButton) {
				saveButton.addEventListener("click", function() {
					const newText = textarea.value;
					updatePostInDatabase(postId, newText);
					disableEditing(postDiv);
				});
			}

			textarea.focus();
		} else {
			console.error("Пост не найден.");
		}
	}).catch((error) => {
		console.error("Ошибка при получении поста:", error);
	});
}


function updatePostInDatabase(postId, newText) {
	const postRef = ref(db, `posts/${postId}`);

	get(postRef).then((snapshot) => {
		if (snapshot.exists()) {
			const postData = snapshot.val();
			const updatedPostData = {
				...postData,
				text: newText,
			};

			set(postRef, updatedPostData)
				.then(() => {
					console.log("Пост успешно обновлен.");
					loadPosts();
				})
				.catch((error) => {
					console.error("Ошибка при обновлении поста:", error);
				});
		} else {
			console.error("Пост не найден.");
		}
	}).catch((error) => {
		console.error("Ошибка при получении поста:", error);
	});
}



function deletePost(postId) {
	const currentUser = localStorage.getItem('currentUser');
	const postRef = ref(db, `posts/${postId}`);
	get(postRef).then((snapshot) => {
		const postData = snapshot.val();
		if (postData) {
			if (currentUser === postData.user || currentUser === 'admin') {
				remove(postRef).then(() => {
					console.log("Пост успешно удален");

					const postElement = document.querySelector(`.post [data-id='${postId}']`).closest('.post');
					if (postElement) {
						postElement.remove();
					}
				}).catch((error) => {
					console.error("Ошибка при удалении поста:", error);
				});
			} else {
				showMessage("У вас нет прав на удаление этого поста", "error");
			}
		} else {
			console.error("Пост не найден.");
		}
	}).catch((error) => {
		console.error("Ошибка при получении поста:", error);
	});
}




function parseTextToHtml(text) {
	const codeBlocks = [];

	text = text.replace(/\[code\]([\s\S]*?)\[\/code\]/g, function(match, codeContent) {
		codeBlocks.push(codeContent);
		return `<codeblock-${codeBlocks.length - 1}/>`;
	});

	text = text
		.replace(/\[a=(.*?)\](.*?)\[\/a\]/g, '<a href="$1" target="_blank">$2</a>')
		.replace(/\[img(?:\s*w=(\d+))?(?:\s*h=(\d+))?\](.*?)\[\/img\]/g, function(match, w, h, url) {
			let style = '';
			if (w) style += `width:${w}px;`;
			if (h) style += `height:${h}px;`;
			return `<a href="${url}" data-fancybox="gallery"><img src="${url}" alt="img" style="${style}"></a>`;
		})
		.replace(/\[div\](.*?)\[\/div\]/g, '<div>$1</div>')
		.replace(/\[div=(.*?)\](.*?)\[\/div\]/g, '<div class="$1">$2</div>')
		.replace(/\[span\](.*?)\[\/span\]/g, '<span>$1</span>')
		.replace(/\[span=(.*?)\](.*?)\[\/span\]/g, '<span class="$1">$2</span>')
		.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>')
		.replace(/\[br\]/g, '<br>')
		.replace(/\[hr\]/g, '<hr>')
		.replace(/\[b\](.*?)\[\/b\]/g, '<b>$1</b>')
		.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
		.replace(/\[i\](.*?)\[\/i\]/g, '<i>$1</i>')
		.replace(/\[s\](.*?)\[\/s\]/g, '<s>$1</s>')
		.replace(/\[h1\](.*?)\[\/h1\]/g, '<h1>$1</h1>')
		.replace(/\[h2\](.*?)\[\/h2\]/g, '<h2>$1</h2>')
		.replace(/\[h3\](.*?)\[\/h3\]/g, '<h3>$1</h3>')
		.replace(/\[h4\](.*?)\[\/h4\]/g, '<h4>$1</h4>')
		.replace(/\[h5\](.*?)\[\/h5\]/g, '<h5>$1</h5>')
		.replace(/\[h6\](.*?)\[\/h6\]/g, '<h6>$1</h6>')
		.replace(/\[kbd\](.*?)\[\/kbd\]/g, '<kbd>$1</kbd>')
		.replace(/\[q\](.*?)\[\/q\]/g, '<blockquote>$1</blockquote>')
		.replace(/\[center\](.*?)\[\/center\]/g, '<center>$1</center>')
		.replace(/\[right\](.*?)\[\/right\]/g, '<div style="text-align: right;">$1</div>')
		.replace(/\[s=(.*?)\]([\s\S]*?)\[\/s\]/g, '<details><summary>$1</summary>$2</details>')
		.replace(/\[v\](https?:\/\/[^\s]+)\[\/v\]/g, (match, fullUrl) => {
			const url = new URL(fullUrl);
			const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();

			if (videoId) {
				return `<iframe src="https://www.youtube.com/embed/${videoId}" min-width="250px" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
			}
			return match;
		})

		.replace(/^>\* (.*)$/gm, '<li>$1</li>');

	text = text.replace(/<codeblock-(\d+)\/>/g, function(match, index) {
		return `<pre><code>${codeBlocks[index]}</code></pre>`;
	});

	return text;
}



const buttons = document.querySelectorAll('.hzp');

buttons.forEach(button => {
	button.addEventListener('click', function() {
		button.classList.toggle('on');
	});
});



document.addEventListener('DOMContentLoaded', function() {
	const commentInput = document.getElementById('editable');
	const submitButton = document.getElementById('send');

	function insertBBCode(tagStart, tagEnd) {
		const startPos = commentInput.selectionStart;
		const endPos = commentInput.selectionEnd;
		const selectedText = commentInput.value.substring(startPos, endPos);

		const beforeText = commentInput.value.substring(0, startPos);
		const afterText = commentInput.value.substring(endPos);

		if (selectedText) {
			commentInput.value = beforeText + tagStart + selectedText + tagEnd + afterText;
		} else {
			commentInput.value = beforeText + tagStart + tagEnd + afterText;
		}

		commentInput.selectionStart = commentInput.selectionEnd = startPos + tagStart.length + selectedText.length + tagEnd.length;
		commentInput.focus();
	}

	document.addEventListener('keydown', function(event) {
		if (event.ctrlKey) {
			switch (event.code) {
				case 'KeyO':
					event.preventDefault();
					insertBBCode('[code=code]', '[/code]');
					break;
				case 'KeyX':
					event.preventDefault();
					insertBBCode('[v]', '[/v]');
					break;
				case 'KeyS':
					event.preventDefault();
					insertBBCode('[s=текст]', '[/s]');
					break;
			}
		}
	});

	commentInput.addEventListener('keydown', function(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submitButton.click();
		}
	});
});
