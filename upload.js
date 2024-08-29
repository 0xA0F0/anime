document.getElementById("upload").addEventListener("click", function() {
    document.getElementById("files").click();
});

document.getElementById("upload").addEventListener("dragover", function(e) {
    e.preventDefault();
    e.stopPropagation();
});

document.getElementById("upload").addEventListener("drop", function(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
});

document.getElementById("files").addEventListener("change", function(e) {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const file = files[0];
    const messageElement = document.getElementById("message");
    const progressBar = document.getElementById("progressBar");
    const linkElement = document.getElementById("link");
    const noExpirationCheckbox = document.getElementById("noExpiration");
    const validFormats = ['image/jpeg', 'image/png', 'image/gif'];

    if (messageElement.timeoutId) {
        clearTimeout(messageElement.timeoutId);
    }

    if (!validFormats.includes(file.type)) {
        messageElement.textContent = "Неподдерживаемый формат файла. Выберите изображение.";
        messageElement.timeoutId = setTimeout(() => messageElement.textContent = "", 3000);
        return;
    }

    if (file.size > 30 * 1024 * 1024) {
        messageElement.textContent = "Файл превышает 30 МБ.";
        messageElement.timeoutId = setTimeout(() => messageElement.textContent = "", 3000);
        return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", "6db7231dddc8659c27f5b82c502d4382");
    if (!noExpirationCheckbox.checked) {
        formData.append("expiration", 2592000);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.imgbb.com/1/upload", true);

    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            progressBar.style.display = "block";
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.value = percentComplete;
        }
    };

    xhr.onload = function() {
        progressBar.style.display = "none";
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                linkElement.innerHTML = `Скопируй: <a href="${response.data.url}" target="_blank">${response.data.url}</a>`;
                linkElement.classList.add("ready");
            } else {
                messageElement.textContent = "Ошибка при загрузке файла.";
                messageElement.timeoutId = setTimeout(() => messageElement.textContent = "", 2000);
            }
        } else {
            messageElement.textContent = "Ошибка при загрузке файла.";
            messageElement.timeoutId = setTimeout(() => messageElement.textContent = "", 2000);
        }
    };

    xhr.onerror = function() {
        progressBar.style.display = "none";
        messageElement.textContent = "Произошла ошибка при загрузке.";
        messageElement.timeoutId = setTimeout(() => messageElement.textContent = "", 2000);
    };

    xhr.send(formData);
}
