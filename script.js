for(let i = 0; i <= 5; i++){
    for(let j = 0; j <=6; j++){
        let elem = document.createElement('div');
        elem.className = `field_${i}_${j}`;
        elem.innerHTML = "<img src='field_fragment.svg'>";
        document.querySelector(".field").append(elem);
    }
}
//document.querySelector(".field_0_0").innerHTML = "<img src='field_fragment.svg'>";