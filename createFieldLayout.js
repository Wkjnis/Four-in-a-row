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

/*
    Объекты со свойствами игроков: цветом фишки:chipColor, именем: name,
    типом игрока('player' или 'computer'): type, индксом для массива игрового поля: fieldArrayIndex
*/
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

//Переменная содержащая объект текущего игрока
let currentPlayer = player1;

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
        dropsElem.onclick = () => { 
            chipDrop(dropsElem.dataset.index);
        };
        document.querySelector(".drops").append(dropsElem);
    }
}

//Функция реализует бросок фишки в стоблец dropsIndex во время хода игрока currentPlayer
function chipDrop(dropsIndex) {
    //Здесь dropsIndex СТРОКА!!!!!
    let chip = addChip (+dropsIndex);
    let fieldRow = getHigestEmptyCell(+dropsIndex);
    //Позиционируем фишку
    chip.style.top = 11*(fieldRow + 1) + 3 +'vh';
    //Добавляем фишку в массив игрового поля
    fieldArray[fieldRow][+dropsIndex] = currentPlayer.fieldArrayIndex;
    disableDropIfFull(+dropsIndex);
    isGameEnd(fieldRow, +dropsIndex);
    changePlayer();
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
//и прверяетповлияла ли фишка, размещенная по этим координатам на победу игрока или на ничью
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
