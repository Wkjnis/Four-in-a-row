for(let i = 0; i <= 5; i++){
    for(let j = 0; j <= 6; j++){
        let elem = document.createElement('div');
        elem.className = `field_${i}_${j}`;
        elem.innerHTML = "<img src='field_fragment.svg'>";
        document.querySelector(".field").append(elem);
    }
}

for(let i = 0; i <= 6; i++){
    let elem = document.createElement('div');
    elem.className = `drop_${i}`;
    elem.innerHTML = `<img class="chip" src="red_chip.svg" alt="chip">`;
    document.querySelector(".drops").append(elem);
}