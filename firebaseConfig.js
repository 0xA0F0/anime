// Зашифрованная строка, которую вы получили
const encryptedConfig = "U2FsdGVkX1+ORkLf1MmLPraQVqVRIzxuEUxKgt5NJVfdfEo8AJd/5+ZaE42xrHLfO0gIYlLtXRdRUfJKMTfennQR+rl0ZurhZ6WTW37UnGI1OzjI+fORL8nkeEugSGGPgaRIDjI5kDDNzIhtuwm7em1w2lxcR6rEmk+yxjr6+Z8BP7Dy6i2IJ89aos9Z17S0GM/UTbe+6c/SdMWaiVJ5dKvvvTwkFdKYCUxmj0T23W2DhLsFIAfj71unZPCvlOaKfi6RAsaHph4YDkcMqJBpc9rht7iRfPb6s/ct/60EX2lyc0FNHYWBTUs9AUnWa7u9w7f4FBpsbKJP84wlVzOpRPwvm3VLTe8s5H8Jv/suGD3IOvBFBMADLqdCFtNWbi0zWgF2tO39IL3Maa6IMHyb6UfI4AQs9D/vloIqEKuJbn4LvAqd7aSe7Yk9+sF3UcjEHi7Qd6tYrN+xDQ0MlNh/Kg==";

// Секретный ключ (должен быть таким же, как и при шифровании)
const secretKey = 'c2f0b56f7e2e6a5fa715f53d9f13dbf4';

try {
    // Расшифровка строки конфигурации
    const bytes = CryptoJS.AES.decrypt(encryptedConfig, secretKey);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    // Проверяем, что данные успешно расшифрованы
    if (!decryptedData) {
        throw new Error("Данные не могут быть расшифрованы. Проверьте ключ или шифрованную строку.");
    }

    // Преобразуем расшифрованную строку в объект
    const decryptedConfig = JSON.parse(decryptedData);

    // Инициализация Firebase
    firebase.initializeApp(decryptedConfig);
} catch (error) {
    console.error("Ошибка при расшифровке или инициализации Firebase:", error.message);
}
