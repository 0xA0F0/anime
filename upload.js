
const uploadElement = document.getElementById("upload");

uploadElement.addEventListener("click", function() {
    document.getElementById("files").click();
});

uploadElement.addEventListener("dragover", function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadElement.classList.add("dragover");
});

uploadElement.addEventListener("dragleave", function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadElement.classList.remove("dragover");
});

uploadElement.addEventListener("drop", function(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadElement.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
});

document.getElementById("files").addEventListener("change", function(e) {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length === 0) {
        return;
    }

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
    formData.append("key", "45fd6a42c90f6c423142b91e591b910a");
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
                linkElement.innerHTML = `<a href="${response.data.url}" class="link" target="_blank">${response.data.url}</a> <span class="mdi mdi-content-copy copy" style="font-size: 15px; cursor: pointer;"></span>`;
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

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy')) {
        const linkElement = e.target.previousElementSibling;
        if (linkElement && linkElement.classList.contains('link')) {
            const range = document.createRange();
            range.selectNode(linkElement);
            window.getSelection().removeAllRanges(); 
            window.getSelection().addRange(range);

            try {
                document.execCommand('copy');
                e.target.classList.add('copied');
                setTimeout(() => e.target.classList.remove('copied'), 3000);
            } catch (err) {
                console.error('Ошибка при копировании текста: ', err);
            }
            
            window.getSelection().removeAllRanges(); 
        } else {
            console.error('Не удалось найти элемент с классом link');
        }
    }
});
