document.addEventListener('DOMContentLoaded', function () {
    const commentForm = document.getElementById('commentForm');
    const commentInput = document.getElementById('commentInput');
    const submitButton = commentForm.querySelector('button[type="submit"]');

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

    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey) {
            switch (event.code) {
                case 'KeyO':
                    event.preventDefault();
                    insertBBCode('[code=code]', '[/code]');
                    break;
                case 'KeyX':
                    event.preventDefault();
                    insertBBCode('[video]', '[/video]');
                    break;
                case 'KeyS':
                    event.preventDefault();
                    insertBBCode('[spoiler=текст]', '[/spoiler]');
                    break;
            }
        }
    });

    commentInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); 
            submitButton.click(); 
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('info');

    infoButton.addEventListener('click', () => {
        const existingGuide = document.querySelector('.guide');
        if (existingGuide) {
            return;
        }

        const guideDiv = document.createElement('div');
        guideDiv.className = 'guide';

        guideDiv.innerHTML = `
            <span class="close mdi mdi-close"></span>
            <center style="margin-bottom: 5px;"><h3>Горячие клавиши</h3></center>
            <hr>
            <br>
            <p><kbd>Ctrl</kbd> + <kbd>X</kbd> : [video]ссылка[/video]</p>
            <br>
            <p><kbd>Ctrl</kbd> + <kbd>S</kbd> : [spoiler=текст][/spoiler]</p>
            <br>
            <p><kbd>Ctrl</kbd> + <kbd>O</kbd> : [code=code]код[/code]</p>
        `;

        document.body.appendChild(guideDiv);

        const closeButton = guideDiv.querySelector('.close');
        closeButton.addEventListener('click', () => {
            guideDiv.remove();
        });
    });
});