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
    constructor(name, type, chipColor, fieldArrayIndex){
        this.name = name;
        this.type = type;
        this.chipColor = chipColor;
        this.fieldArrayIndex = fieldArrayIndex;
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
let player1 = new Player('player1', 'player', 'red', 1);
let player2 = new Player('player2', 'player', 'yellow', 2);

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
    let promise = new Promise( (resolve, reject) => {

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
    promise.then( () => {

        //Проверка на победу кого-то или ничью
        isGameEnd(fieldRow, dropsIndex);

        //Меняем текущего игрока
        changePlayer();

        //Включаем возможность хода
        enableAllDrops();
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
        //Если хотим удалять обработчики событий:
        //document.querySelector(`.drop_${dropsIndex}`).innerHTML = '';
        if( dropsArray[dropsIndex] ) {
            dropsArray[dropsIndex] = false;
        }
    }
}

//Функция меняет текущего игрока
function changePlayer() {
    switch (currentPlayer) {
        case player1:
            currentPlayer = player2;
            break;
        case player2:
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
                alert(currentPlayer.chipColor + 'win');
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
                alert(currentPlayer.chipColor + 'win');
                return;
        }
        /* Тоже самое, что и выше, но через опциональную цепочку
        if( fieldArray[startRow + i]?.[startColumn] == chipColor && 
            fieldArray[startRow + 1 + i]?.[startColumn] == chipColor &&
            fieldArray[startRow + 2 + i]?.[startColumn] == chipColor &&
            fieldArray[startRow + 3 + i]?.[startColumn] == chipColor) {
                alert(currentPlayer.chipColor + 'win');
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
                alert(currentPlayer.chipColor + 'win');
                return;
        }
        /* Тоже самое, что и выше, но через опциональную цепочку
        if( fieldArray[startRow + i]?.[startColumn + i] == chipColor && 
            fieldArray[startRow + 1 + i]?.[startColumn + 1 + i] == chipColor &&
            fieldArray[startRow + 2 + i]?.[startColumn + 2 + i] == chipColor &&
            fieldArray[startRow + 3 + i]?.[startColumn + 3 + i] == chipColor) {
                alert(currentPlayer.chipColor + 'win');
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
                alert(currentPlayer.chipColor + 'win');
                return;
        }
        /* Тоже самое, что и выше, но через опциональную цепочку
        if( fieldArray[startRow + i]?.[startColumn - i] == chipColor && 
            fieldArray[startRow + 1 + i]?.[startColumn - 1 - i] == chipColor &&
            fieldArray[startRow + 2 + i]?.[startColumn - 2 - i] == chipColor &&
            fieldArray[startRow + 3 + i]?.[startColumn - 3 - i] == chipColor) {
                alert(currentPlayer.chipColor + 'win');
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
        alert('draw');
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
    //Убираем стартовое модальное окно
    document.querySelector('.startScreen').style.display = 'none';
    //Заменяем стандартных игроков на пользовательских 
    player1 = new Player(form.player1Name.value, 'human', form.player1Color.value, 1);
    player2 = new Player(form.player2Name.value, form.opponent.value, form.player2Color.value, 2);
    //Обновляем текущего игрока
    currentPlayer = player1;
    //Заменяем стандартные фишки внутри .drops на пользовательскте
    document.querySelectorAll('.started').forEach( (dropsElem) => {
        if( dropsArray[dropsElem.dataset.index] ) {
            dropsElem.querySelector('img').remove();
            dropsElem.insertAdjacentHTML("beforeend", `<img class="chip" src="${currentPlayer.chipColor}_chip.svg" alt="${currentPlayer.chipColor}_chip">`);
        }
    } );
}

//Функция устанавливает стандартные настройки, а если есть пользоательские, то устанавливает пользовательские и сохраняет их
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
    console.log(document.querySelector(`.radioCircle[data-name=player1Color][data-value=${defaultSettings.player1Color}]`));
    document.querySelector(`.radioCircle[data-name=player1Color][data-value=${defaultSettings.player1Color}]`).dispatchEvent(eventClick);
    document.querySelector(`.radioCircle[data-name=player2Color][data-value=${defaultSettings.player2Color}]`).dispatchEvent(eventClick);
    document.querySelector(`.opponent[data-value=${defaultSettings.opponent}]`).dispatchEvent(eventClick);
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
    setDefaultSettings();
}