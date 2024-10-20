// auth.js

export default {
  data() {
    return {
      user: null,
      email: '',
      password: '',
      nickname: '',
      avatarFile: null,
      avatarPreview: null,
      resetEmail: '',
      showPassword: false,
      encryptedApiKey: 'U2FsdGVkX1+i+Ec8auTGS78uIo8oV91YPyEYfwazQT8foEdGzNY0jAypHYQx3ADzGLnUn5/Wda/l1Mnr/UriIA==',
      encryptionPassword: 'Pq8#Xv2!LzY3@WhG5&rK7$TdNf4^Bj6M'
    };
  },
  methods: {
    decryptApiKey(encryptedKey, password) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedKey, password);
        const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedKey;
      } catch (error) {
        console.error('Ошибка при расшифровке API-ключа:', error);
        return null;
      }
    },
    onDragOver(event) {
      event.preventDefault();
      this.isDragOver = true;
    },
    onDragLeave(event) {
      event.preventDefault();
      this.isDragOver = false;
    },
    onDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        this.onAvatarChange({ target: { files } });
      }
    },
    onAvatarChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.avatarFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.avatarPreview = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.avatarFile = null;
        this.avatarPreview = null;
      }
    },
    async login() {
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(this.email, this.password);
        this.user = userCredential.user;
        await this.updateUserData();
        this.showMessage('Ты в системе', 'success');
      } catch (error) {
        console.error("Ошибка при входе:", error);
        let message = 'Произошла ошибка при входе.';
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            message = 'Неправильный пароль или e-mail.';
            break;
          case 'auth/invalid-email':
            message = 'Неверный формат e-mail.';
            break;
          case 'auth/user-disabled':
            message = 'Этот пользователь был отключён.';
            break;
          default:
            message = `Ошибка: ${error.message}`;
        }
        this.showMessage(message, 'error');
      }
    },
    async register() {
      if (!this.avatarFile) {
        this.showMessage('Пожалуйста, загрузите аватарку.', 'error');
        return; 
      }

      try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(this.email, this.password);
        this.user = userCredential.user;
        let avatarURL = '';

        const apiKey = this.decryptApiKey(this.encryptedApiKey, this.encryptionPassword);
        if (!apiKey) throw new Error('Не удалось расшифровать API-ключ');

        const formData = new FormData();
        formData.append('image', this.avatarFile);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          avatarURL = data.data.url;
        } else {
          throw new Error('Ошибка при загрузке аватарки');
        }

        await this.user.updateProfile({
          displayName: this.nickname,
          photoURL: avatarURL
        });

        await this.updateUserData();
        await firebase.database().ref('users/' + this.user.uid + '/animes').set([]);
        window.location.hash = '#home';
        this.showMessage('Ты в системе', 'success');
      } catch (error) {
        console.error("Ошибка при регистрации:", error);
        let message = 'Ошибка при регистрации.';
        switch (error.code) {
          case 'auth/email-already-in-use':
            message = 'Этот e-mail уже используется.';
            break;
          case 'auth/invalid-email':
            message = 'Неверный формат e-mail.';
            break;
          case 'auth/weak-password':
            message = 'Пароль слишком простой.';
            break;
          default:
            message = `Ошибка: ${error.message}`;
        }
        this.showMessage(message, 'error');
      }
    },
    async resetPassword() {
      try {
        await firebase.auth().sendPasswordResetEmail(this.resetEmail);
        this.showMessage('Письмо со ссылкой на сброс пароля отправлено на ваш email.', 'success');
        window.location.hash = '#login';
      } catch (error) {
        console.error("Ошибка при сбросе пароля:", error);
        let message = 'Произошла ошибка при сбросе пароля.';
        switch (error.code) {
          case 'auth/invalid-email':
            message = 'Неверный формат e-mail.';
            break;
          case 'auth/user-not-found':
            message = 'Пользователь с таким e-mail не найден.';
            break;
          default:
            message = `Ошибка: ${error.message}`;
        }
        this.showMessage(message, 'error');
      }
    },

    logout() {
      firebase.auth().signOut().then(() => {
        this.user = null;
        this.userAnimes = {};
        window.location.hash = '/';
        this.showMessage('Ты вне системы', 'success');
      }).catch((error) => {
        console.error("Ошибка при выходе из аккаунта:", error);
        this.showMessage("Произошла ошибка при выходе из аккаунта.", "error");
      });
    },

    async deleteAccount() {
      if (!this.user) {
        this.showMessage('Пользователь не найден.', 'error');
        return;
      }
      const confirmation = confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.');
      if (!confirmation) return;
      try {
        const uid = this.user.uid;
        await firebase.database().ref('users/' + uid).remove();
        await this.user.delete();
        this.user = null;
        this.showMessage('Аккаунт успешно удален.', 'success');
        window.location.hash = '/';
      } catch (error) {
        console.error('Ошибка при удалении аккаунта:', error);
        let message = 'Произошла ошибка при удалении аккаунта.';
        if (error.code === 'auth/requires-recent-login') {
          message = 'Для удаления аккаунта требуется повторный вход. Пожалуйста, войдите снова.';
        } else if (error.code === 'auth/no-current-user') {
          message = 'Пользователь не аутентифицирован.';
        }
        this.showMessage(message, 'error');
      }
    },
    async updateUserData() {
      const user = firebase.auth().currentUser;
      if (user) {
        await user.reload();
        this.user = user;
      }
    },
    showMessage(message, type) {
      if (type === 'success') {
        alert(`✅ ${message}`);
      } else if (type === 'error') {
        alert(`❌ ${message}`);
      } else {
        alert(message);
      }
    }
  }
};
