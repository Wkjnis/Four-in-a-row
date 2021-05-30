//'use strict';

//Массив столбцов, с возможность бросать в них фишку
const dropsArray = [true, true, true, true, true, true, true];

//Массив игрового поля
const fieldArray = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
];

//Класс для создания объектов игроков(экземпляров этого класса)
class Player {
    constructor(name, type, chipColor, fieldArrayIndex, startFirst){
        this.name = name;
        this.type = type;
        this.chipColor = chipColor;
        this.fieldArrayIndex = fieldArrayIndex;
        this.startFirst = startFirst;
        this.score = 0;
    }
}

//Класс для создания объектов настроек(экземпляров этого класса)
class Settings {
    constructor(player1Name, player1Color, player2Name, player2Color, opponent){
        this.player1Name = player1Name;
        this.player1Color = player1Color;
        this.player2Name = player2Name;
        this.player2Color = player2Color;
        this.opponent = opponent;
    }
}

//Ставим обработчики на форму и начальные настройки
addListenersAndDefaultSettings();

/*Создание экземпляров класса
Создаются стандартные игроки, как гарантия того, что все будет работать
Внутри функции startGame они заменяются на пользовательские
*/
let player1 = new Player('player1', 'human', 'red', 1, true);
let player2 = new Player('player2', 'human', 'yellow', 2, false);

/*
    Объекты со свойствами игроков: цветом фишки:chipColor, именем: name,
    типом игрока('player' или 'computer'): type, индксом для массива игрового поля: fieldArrayIndex
const player1 = {
    chipColor: "red",
    name: "player1",
    type: "player",
    fieldArrayIndex: 1
};
const player2 = {
    chipColor: "yellow",
    name: "player2",
    type: "player",
    fieldArrayIndex: 2
};
*/

//Переменная содержащая объект текущего игрока
let currentPlayer = player1;

//Динамически создаем верстку
createFieldLayout();
createDropsLayout(currentPlayer);

//Функция создает игровое поле
function createFieldLayout() {
    for( let i = 0; i <= 5; i++ ) {
        for( let j = 0; j <= 6; j++ ) {
            let fieldElem = document.createElement('div');
            fieldElem.className = `field_${i}_${j}`;
            fieldElem.insertAdjacentHTML("beforeend",`<img class="fieldFragment" src="field_fragment.svg" alt="fieldFragment">`);
            document.querySelector(".field").append(fieldElem);
        }
    }
}

//Функция создает область для броска фишек
function createDropsLayout( currentPlayer ) {
    for( let i = 0; i <= 6; i++ ) {
        let dropsElem = document.createElement('div');
        dropsElem.className = `drop_${i} started`;
        dropsElem.setAttribute('data-index', i);
        dropsElem.insertAdjacentHTML("beforeend", `<img class="chip" src="${currentPlayer.chipColor}_chip.svg" alt="${currentPlayer.chipColor}_chip">`);
        dropsElem.addEventListener('click', chipDrop);
        document.querySelector(".drops").append(dropsElem);
    }
}

//Функция реализует бросок фишки в стоблец dropsIndex во время хода игрока currentPlayer
function chipDrop(event) {

    //Отключаем возможность хода
    disableAllDrops();

    //Сохраняем индекс столбца, куда бросили фишку
    let dropsIndex = +event.currentTarget.dataset.index;

    //Создаем фишку и добавляем ее
    let chip = addChip (dropsIndex);

    //Находим ячейку, куда она должна упасть
    let fieldRow = getHigestEmptyCell(dropsIndex);

    //Фишка будет отпозиционированна сюда:
    //chip.style.top = 11*(fieldRow + 1) + 3 +'vh';

    //Добавляем фишку в массив игрового поля
    fieldArray[fieldRow][dropsIndex] = currentPlayer.fieldArrayIndex;

    //Отключаем возможность бросать фишки в этот столбец, если он заполнен
    disableDropIfFull(dropsIndex);

    //Создаем промис в котором отрисовываем анимацию
    const promiseAnimation = new Promise( (resolve, reject) => {

        //Функция для отрисовки прогресса анимации
        function draw(progress) {
            chip.style.top = progress*11*(fieldRow+1) + progress*3 + 'vh';
        }

        //Длительность анимации, зависящяя от высоты падения
        let duration = Math.pow((2*(fieldRow+1)/9.8),0.5)*1000;

        //Функция, по возвращаемым значениям которой, и происходит анимация (отскоки)
        function bounce(timeFraction) {
            //Цикл не бесконечный, он сработает максимум 4 раза (зависит от того в ком моменте анимации он вызывается)
            for (let a = 0, b = 1;; a += b, b /= 2) {
                if ((1 - timeFraction) >= (7 - 4 * a) / 11) {
                    return 1 - (-Math.pow((11 - 6 * a - 11 * (1 - timeFraction)) / 4, 2) + Math.pow(b, 2));
                }
            }
        }

        //Функция, управляющяя анимацией
        function animate({timing, draw, duration}) {
            let start = performance.now();
            requestAnimationFrame(function animateFrame(time) {
                let timeFraction = (time - start) / duration;
                if (timeFraction > 1)timeFraction = 1;
                let progress = timing(timeFraction);
                draw(progress);
                if (timeFraction < 1) {
                    requestAnimationFrame(animateFrame);
                }
                if ( timeFraction == 1 ) {
                    resolve('done');
                }
            });
        }
        
        //Запускаем анимацию
        animate({timing: bounce, draw: draw, duration: duration});
    } );

    //Выполняем действия после отрисовки анимации
    promiseAnimation.then( () => {

        //Проверка на победу кого-то или ничью
        isGameEnd(fieldRow, dropsIndex);

        //Меняем текущего игрока
        changePlayer();

        //Включаем возможность хода
        enableAllDrops();

        //Если 2 игрок это компьютер, то делаем его ход
        if(currentPlayer.type === 'computer') {
            makeComputerTurn();
        }
    } );
}

// Функция добавляет фишку на поле в столбец dropsIndex цвета chipColor из объекта currentPlayer и возвращает ее
function addChip (dropsIndex)  {
    let chip = document.createElement('div');
    chip.className = `drop_${dropsIndex} added`;
    chip.insertAdjacentHTML("beforeend", `<img class="chip_added" src="${currentPlayer.chipColor}_chip.svg" alt="${currentPlayer.chipColor}_chip">`);
    document.querySelector(".drops").append(chip);
    return chip;
}

//Функция возвращет номер первой пустой ячейке в стобце dropsIndex, если столбец заполнен, то null
function getHigestEmptyCell (dropsIndex) {
    for( let i = 5; i >= 0 ; i-- ) {
        if( fieldArray[i][dropsIndex] === 0 ) {
            return i;
        }
    }
    return null;
}

// Функция отключает возможность броска фишки в столбец dropsIndex, если он заполнен
function disableDropIfFull(dropsIndex) {
    if( getHigestEmptyCell(dropsIndex) === null ) {
        dropsArray[dropsIndex] = false; 
        document.querySelector(`.drop_${dropsIndex}`).style = "pointer-events: none;";
        document.querySelector(`.drop_${dropsIndex}`).querySelector('img').remove();
    }
}

//Функция меняет текущего игрока
function changePlayer() {
    switch (currentPlayer) {
        case player1:
            document.querySelector('#player1Current').style.animationPlayState = 'paused';
            document.querySelector('#player2Current').style.animationPlayState = 'running';
            currentPlayer = player2;
            break;
        case player2:
            document.querySelector('#player2Current').style.animationPlayState = 'paused';
            document.querySelector('#player1Current').style.animationPlayState = 'running';
            currentPlayer = player1;
            break;
    }
    document.querySelectorAll('.started').forEach( (dropsElem) => {
        if( dropsArray[dropsElem.dataset.index] ) {
            dropsElem.querySelector('img').remove();
            dropsElem.insertAdjacentHTML("beforeend", `<img class="chip" src="${currentPlayer.chipColor}_chip.svg" alt="${currentPlayer.chipColor}_chip">`);
        }
    } );
}

//Функция принимает индекс столбца dropsIndex(число) и индекст строки fieldRow(число)
//и прверяет повлияла ли фишка, размещенная по этим координатам на победу игрока или на ничью
function isGameEnd(fieldRow, dropsIndex) {

    //Проверка горизонтали
    let startRow = fieldRow;
    let startColumn = dropsIndex - 3;
    let chipColor = fieldArray[fieldRow][dropsIndex];
    for(let i = 0; i <= 3; i++) {
        if( fieldArray[startRow][startColumn + i] == chipColor && 
            fieldArray[startRow][startColumn + 1 + i] == chipColor &&
            fieldArray[startRow][startColumn + 2 + i] == chipColor &&
            fieldArray[startRow][startColumn + 3 + i] == chipColor) {
                win(currentPlayer);
                return;
        }
    }

    //Проверка вертикали
    startRow = fieldRow - 3;
    startColumn = dropsIndex;
    for(let i = 0; i <= 3; i++) {
        if( (fieldArray[startRow + i] && fieldArray[startRow + i][startColumn]) == chipColor && 
            (fieldArray[startRow + 1 + i] && fieldArray[startRow + 1 + i][startColumn]) == chipColor &&
            (fieldArray[startRow + 2 + i] && fieldArray[startRow + 2 + i][startColumn]) == chipColor &&
            (fieldArray[startRow + 3 + i] && fieldArray[startRow + 3 + i][startColumn]) == chipColor) {
                win(currentPlayer);
                return;
        }
        /* Тоже самое, что и выше, но через опциональную цепочку
        if( fieldArray[startRow + i]?.[startColumn] == chipColor && 
            fieldArray[startRow + 1 + i]?.[startColumn] == chipColor &&
            fieldArray[startRow + 2 + i]?.[startColumn] == chipColor &&
            fieldArray[startRow + 3 + i]?.[startColumn] == chipColor) {
                win(currentPlayer);
                return;
        }
        */
    }

    //Проверка главной диагонали
    startRow = fieldRow - 3;
    startColumn = dropsIndex - 3;
    for(let i = 0; i <= 3; i++) {
        if( (fieldArray[startRow + i] && fieldArray[startRow + i][startColumn + i]) == chipColor && 
            (fieldArray[startRow + 1 + i] && fieldArray[startRow + 1 + i][startColumn + 1 + i]) == chipColor &&
            (fieldArray[startRow + 2 + i] && fieldArray[startRow + 2 + i][startColumn + 2 + i]) == chipColor &&
            (fieldArray[startRow + 3 + i] && fieldArray[startRow + 3 + i][startColumn + 3 + i]) == chipColor) {
                win(currentPlayer);
                return;
        }
        /* Тоже самое, что и выше, но через опциональную цепочку
        if( fieldArray[startRow + i]?.[startColumn + i] == chipColor && 
            fieldArray[startRow + 1 + i]?.[startColumn + 1 + i] == chipColor &&
            fieldArray[startRow + 2 + i]?.[startColumn + 2 + i] == chipColor &&
            fieldArray[startRow + 3 + i]?.[startColumn + 3 + i] == chipColor) {
                win(currentPlayer);
                return;
        }
        */
    }
    
    //Проверка побочной диагонали
    startRow = fieldRow - 3;
    startColumn = dropsIndex + 3;
    for(let i = 0; i <= 3; i++) {
        if( (fieldArray[startRow + i] && fieldArray[startRow + i][startColumn - i]) == chipColor && 
            (fieldArray[startRow + 1 + i] && fieldArray[startRow + 1 + i][startColumn - 1 - i]) == chipColor &&
            (fieldArray[startRow + 2 + i] && fieldArray[startRow + 2 + i][startColumn - 2 - i]) == chipColor &&
            (fieldArray[startRow + 3 + i] && fieldArray[startRow + 3 + i][startColumn - 3 - i]) == chipColor) {
                win(currentPlayer);
                return;
        }
        /* Тоже самое, что и выше, но через опциональную цепочку
        if( fieldArray[startRow + i]?.[startColumn - i] == chipColor && 
            fieldArray[startRow + 1 + i]?.[startColumn - 1 - i] == chipColor &&
            fieldArray[startRow + 2 + i]?.[startColumn - 2 - i] == chipColor &&
            fieldArray[startRow + 3 + i]?.[startColumn - 3 - i] == chipColor) {
                win(currentPlayer);
            return;
        }
        */
    }

    //Проверка на ничью
    let chipsQuantity = 0;
    fieldArray.forEach( (elem) => {
        elem.forEach( (value) => {
            if( value === 0 ) {
                return;
            } else {
                chipsQuantity++;
            }
        } );
    } );
    if ( chipsQuantity === 42 ) {
        win(null);
    }
}

//Функция отключает возможность броска фишки во все столбцы
function disableAllDrops() {
    document.querySelectorAll(`.started`).forEach( (elem) => {
        elem.style = "pointer-events: none;";
    });
}

//Функция включает возможность броска фишки во все столбцы, кроме заполненых
function enableAllDrops() {
    document.querySelectorAll(`.started`).forEach( (elem) => {
        if( dropsArray[elem.dataset.index] ) {
            elem.style = "pointer-events: auto;";
        }
    });
}

//Функция связывает input[type="radio"] с соответствующим ему цветовым кружком
function selectColor(event) {
    //Не даем пользователям выбрать одинаковый цвет
    if(event.target.dataset.name === "player1Color") {
        if(document.querySelector(`input[value=${event.target.dataset.value}][name=player2Color]`).checked === true) {
            return;
        }
    } else {
        if(document.querySelector(`input[value=${event.target.dataset.value}][name=player1Color]`).checked === true) {
            return;
        }
    }
    //Меняем нужный нам input[type="radio"] на значение выбранного цвета
    document.querySelector(`input[value=${event.target.dataset.value}][name=${event.target.dataset.name}]`).checked = true;
    //Также визуально выделяем кружок с выбранным цветом и убираем выделение с других
    document.querySelectorAll(`.radioCircle[data-name=${event.target.dataset.name}]`).forEach( (elem) => {
        if(elem.classList.contains('radioCircleSelected')) {
            elem.classList.remove('radioCircleSelected');
        }
    } );
    event.target.classList.add('radioCircleSelected');
}

//Нормализация имени пользователя(удаление пробелов в начале и в конце имени)
function nameNormalization(event) {
    event.target.value = event.target.value.replace(/^\s+|\s+$/g, '');
}

//Функция связывает input[type="radio"] с соответствующей ему картинкой оппонента 
function selectOpponent(event) {
    //Меняем нужный нам input[type="radio"] на значение выбранного оппонента
    document.querySelector(`input[value=${event.target.dataset.value}][name=${event.target.dataset.name}]`).checked = true;
    //Также визуально выделяем картинку с выбранным оппонентом и убираем выделение с других
    document.querySelectorAll(`.opponent`).forEach( (elem) => {
        if(elem.classList.contains('opponentSelected')) {
            elem.classList.remove('opponentSelected');
        }
    } );
    event.target.classList.add('opponentSelected');
}

//Функция сохраняет настройки и начинает игру
function startGame() {
    //Сохраняем настройки
    const form = document.querySelector('form[name=settings]');
    const settings = new Settings(form.player1Name.value, form.player1Color.value, form.player2Name.value, form.player2Color.value, form.opponent.value);
    localStorage.setItem('settings', JSON.stringify(settings));
    //Заменяем стандартных игроков на пользовательских 
    player1 = new Player(form.player1Name.value, 'human', form.player1Color.value, 1, true);
    player2 = new Player(form.player2Name.value, form.opponent.value, form.player2Color.value, 2, false);
    //Обновляем текущего игрока
    if(player1.startFirst) {
        currentPlayer = player1;
    } else {
        currentPlayer = player2;
    }
    //Удаляем все добавленные фишки, если они есть
    clearField();
    //Очищаем массив FieldArray
    clearFieldArray();
    //Очищаем массив DropsArray
    clearDropsArray();
    //Включаем все области для броска фишек и добавляем в них картинки фишек
    enableAllDropsIfFull();
    //Заменяем стандартные фишки внутри .drops на пользовательскте
    document.querySelectorAll('.started').forEach( (dropsElem) => {
        dropsElem.querySelector('img').remove();
        dropsElem.insertAdjacentHTML("beforeend", `<img class="chip" src="${currentPlayer.chipColor}_chip.svg" alt="${currentPlayer.chipColor}_chip">`);
    } );
    //Создаем счет
    updateScore();
    //Убираем стартовое модальное окно
    document.querySelector('.startScreen').style.display = 'none';
}

//Функция ставит обработчики на элементы формы
function addListenersAndDefaultSettings() {
    //На картинки для выбора оппонента(режима игры)
    document.querySelectorAll('.opponent').forEach( (elem) => {
        elem.addEventListener('click', selectOpponent);
    } );
    //На кружки для вобора цвета
    document.querySelectorAll('.radioCircle').forEach( (elem) => {
        elem.addEventListener('click', selectColor);
    } );
    //На кнопку "Начать игру" в форме
    document.querySelector('.settings button').addEventListener('click', startGame);
    //На кнопку "Настройки"  
    document.querySelector('#restart').addEventListener('click', restart);
    //На кнопку "Начать заново"
    document.querySelector('#settings').addEventListener('click', openSettings);
    //На кнопку "Сдаться"
    document.querySelector('#concede').addEventListener('click', concede);
    //На кнопку "Следующяя игра"
    document.querySelector('#playAnotherGame').addEventListener('click', playAnotherGame);
    //На поля для ввода имен
    document.querySelectorAll('.settings input[type=text]').forEach( (elem) => {
        elem.addEventListener('blur', nameNormalization);
    } );
    //Устанавливаем начальные настройки
    setDefaultSettings();
}

//Функция устанавливает стандартные настройки и сохраняет их, а если есть пользоательские, то устанавливает пользовательские
function setDefaultSettings() {
    let defaultSettings = new Settings('player1', 'red', 'player2', 'yellow', 'human');
    if(!localStorage.getItem('settings')) {
        localStorage.setItem('settings', JSON.stringify(defaultSettings));
    } else {
        defaultSettings = JSON.parse(localStorage.getItem('settings'));
    }
    document.querySelector(`input[name=player1Name]`).value = defaultSettings.player1Name;
    document.querySelector(`input[name=player2Name]`).value = defaultSettings.player2Name;
    const eventClick = new Event('click');
    document.querySelector(`.radioCircle[data-name=player1Color][data-value=${defaultSettings.player1Color}]`).dispatchEvent(eventClick);
    document.querySelector(`.radioCircle[data-name=player2Color][data-value=${defaultSettings.player2Color}]`).dispatchEvent(eventClick);
    document.querySelector(`.opponent[data-value=${defaultSettings.opponent}]`).dispatchEvent(eventClick);
}

//Реализуем ход компьютера
function makeComputerTurn() {
    //НЕ РЕАЛИЗОВАННО
    const eventClick = new Event('click');
    let randomNumberFrom0To6 =  Math.floor(Math.random() * 7);
    document.querySelector(`.drop_${randomNumberFrom0To6}`).dispatchEvent(eventClick);
}

function computerFirstTurn() {
    if(currentPlayer.type === 'computer' && currentPlayer.startFirst === true) {
        const eventClick = new Event('click');
        document.querySelector(`.drop_3`).dispatchEvent(eventClick);
    }
}

//Создаем счет
function updateScore() {
    //Создаем счет
    document.querySelector('#player1Score').innerHTML = `${player1.name} : ${player1.score}`;
    document.querySelector('#player2Score').innerHTML = `${player2.name} : ${player2.score}`;
    //Создаем блоки с фишками (или меняем), которые будут показывать текущего игрока, при помощи анимации
    if( !document.querySelector('#player1Current') ) {
        const player1Current = document.createElement('div');
        player1Current.insertAdjacentHTML("beforeend",`<img class="chip" src="${player1.chipColor}_chip.svg" alt="${player1.chipColor}_chip">`);
        player1Current.id = 'player1Current';
        document.querySelector('#player1Score').prepend(player1Current);
    } else {
        document.querySelector('#player1Current').insertAdjacentHTML("beforeend",`<img class="chip" src="${player1.chipColor}_chip.svg" alt="${player1.chipColor}_chip">`);
    }
    if( !document.querySelector('#player2Current') ) {
        const player2Current = document.createElement('div');
        player2Current.insertAdjacentHTML("beforeend",`<img class="chip" src="${player2.chipColor}_chip.svg" alt="${player2.chipColor}_chip">`);
        player2Current.id = 'player2Current';
        document.querySelector('#player2Score').prepend(player2Current);
    } else {
        document.querySelector('#player2Current').insertAdjacentHTML("beforeend",`<img class="chip" src="${player2.chipColor}_chip.svg" alt="${player2.chipColor}_chip">`);
    }
    //Ставим анимацию текущего игрока, для второго игрока на паузу
    player2Current.style.animationPlayState = 'paused';
}

/*Функция показывает Попап с переданным вопросом questin, переданным текстом text, и переданными занчениями на кнопках yes и no
Возвращает промис, который завершается со значением, заданным в атрибуте data-answer соответсвующей кнопки*/
function showPopup(text, question = 'Вы уверенны?', yes = 'Да', no = 'Назад'){
    const  promisePopup = new Promise( (resolve, reject) => {
        //Формируем Попап
        document.querySelector('#popupQuestion').innerHTML = question;
        document.querySelector('#popupText').innerHTML = text;
        document.querySelector('#popupYes').innerHTML = yes;
        document.querySelector('#popupNo').innerHTML = no;
        //Показываем Попап
        document.querySelector('.popup').style.marginLeft = '35vw';
        //Функция, дающяя ответ, при нажатии на кнопку
        function answer (event) {
            resolve(event.target.dataset.answer);
        }
        //Ставим обработчики на кнопки
        document.querySelector('#popupYes').addEventListener('click', answer);
        document.querySelector('#popupNo').addEventListener('click', answer);
    } );
    return promisePopup;
}

//Функция, срабатывающяя при нажатии на кнопку "Настройки"
function openSettings() {
    const text = 'Текущяя игровая сессия завершится, а данные текущей игры не сохранятся. После изменения настроек начнется новая игровая сессия.';
    //Показываем Попап, после ответа пользователя выполняем соответствующие действия
    showPopup(text).then( (value) => {
        //Убираем Попап
        document.querySelector('.popup').style.marginLeft = '-100vw';
        if (value === 'yes') {
            //Показываем окно с настройками когда Попап пропадет
            setTimeout( () => {
                document.querySelector('.startScreen').style.display = 'grid';
            } , 300);
        }
    } );
}

//Функция, срабатывающяя при нажатии на кнопку "Начать заново"
function restart() {
    const text = 'Текущая игра будет утеряна. Игровая сессия продолжится так, если бы этой игры не было.';
    //Показываем Попап, после ответа пользователя выполняем соответствующие действия
    showPopup(text).then( (value) => {
        //Убираем Попап
        document.querySelector('.popup').style.marginLeft = '-100vw';
        if (value === 'yes') {
            //Очищаем служебные массивы, игровое поле, область для броска фишек
            clearField();
            clearFieldArray();
            clearDropsArray();
            enableAllDropsIfFull();
            //Ставим игрока, который ходит первым
            if(!currentPlayer.startFirst) {
                changePlayer();
            }
            //Если компьютер ходит первый, делаем ход
            computerFirstTurn();
        }
    } );
}

//Функция, срабатывающяя при нажатии на кнопку "Сдаться"
function concede() {
    const text = 'Вам будет засчитано поражение.';
    //Показываем Попап, после ответа пользователя выполняем соответствующие действия
    showPopup(text).then( (value) => {
        //Убираем Попап
        document.querySelector('.popup').style.marginLeft = '-100vw';
        if (value === 'yes') {
            //Игрок, которому сдались, побеждает
            if(currentPlayer === player1) {
                win(player2);
            } else {
                win(player1);
            }
        }
    } );
}

//Функция, вызывающяяся при победе одного из игроков
function win(player) {
    if(player === null) {
        //ДОРАБОТАТЬ НИЧЬЮ
        alert(draw);
        return;
    }
    //ДОРАБОТАТЬ
    document.querySelector('.winScreen').style.display = "grid";
    player.score += 1;
    updateScore();
}

//Функция, срабатывающяя при нажатии на кнопку "Следующяя игра"
function playAnotherGame() {
    //Убираем экран окончания игры
    document.querySelector('.winScreen').style.display = "none";
    //Передаем первый ход другому игроку
    if(player1.startFirst) {
        player1.startFirst = false;
        player2.startFirst = true;
    } else {
        player1.startFirst = true;
        player2.startFirst = false;
    }
    //Очищаем служебные массивы, игровое поле, область для броска фишек
    clearField();
    clearFieldArray();
    clearDropsArray();
    enableAllDropsIfFull();
    //Меняем игрока, передаем право первого хода
    changePlayer();
    //Если компьютер ходит первый, делаем ход
    computerFirstTurn();
}

//Очистить поле от фишек
function clearField() {
    document.querySelectorAll('.added').forEach( (elem) => {
        elem.remove();
    } );
}

//Очищаем массив FieldArray
function clearFieldArray() {
    for(let i = 0; i <= 5; i++) {
        for(let j = 0; j <= 6; j++) {
            fieldArray[i][j] = 0;
        }
    }
}

//Очищаем массив DropsArray
function clearDropsArray() {
    for(let i = 0; i <= 6; i++) {
        dropsArray[i] = true;
    }
}

//Включаем все области для броска фишек и добавляем в них картинки фишек
function enableAllDropsIfFull() {
    for(let i = 0; i <= 6; i++) {
        if(document.querySelector(`.drop_${i}`).querySelector('img')) {
            document.querySelector(`.drop_${i}`).querySelector('img').remove();
        }
        document.querySelector(`.drop_${i}`).style = "pointer-events: auto;";
        document.querySelector(`.drop_${i}`).insertAdjacentHTML("beforeend", `<img class="chip" src="${currentPlayer.chipColor}_chip.svg" alt="${currentPlayer.chipColor}_chip">`);
    }
}
