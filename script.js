
let clicking = false;
let pos = [0, 0];
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
let time = 0;
let before = time;
let current = [];
let previous = [];
let target = [];
const boxes = [];

let tryingdrop = false;

let normalparam = [0.8, 0.8, 0.8];
let colorparam = [0.8, 0.2, 0.2];
let canmg = false;
const canvas = document.createElement('canvas');
canvas.height = 40;
canvas.width = 40;
const context = canvas.getContext('2d');
if (window.location.search.length > 0) {
    let strparams = window.location.search.replace('?', '');
    const mg = new Image();
    mg.onload = () => {
        context.drawImage(mg, 0, 0, 40, 40);
    }
    mg.src = strparams;
    canmg = true;
    /*
    colorparam = [parseFloat(decoded[0]) / 256, parseFloat(decoded[1]) / 256, parseFloat(decoded[2]) / 256];
    normalparam = [parseFloat(decoded[3]) / 256, parseFloat(decoded[4]) / 256, parseFloat(decoded[5]) / 256];
    */
}

const init = () => {

    const scene = new THREE.Scene();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0.95, 0.95, 0.95));
    document.body.appendChild(renderer.domElement);

    for (let x = -20; x < 20; x++) {
        boxes[x + 20] = [];
        target[x + 20] = [];

        current[x + 20] = [];
        previous[x + 20] = [];
        for (let z = -20; z < 20; z++) {
            const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
            let material;
            if (canmg) {
                let p = context.getImageData(x + 20, z + 20, 1, 1).data
                material = new THREE.ShaderMaterial({
                    uniforms: {
                        normalcolor: {
                            value: [p[0] / 256, p[1] / 256, p[2] / 256]
                        },
                        heightcolor: {
                            value: [p[0] / 256, p[1] / 256, p[2] / 256]
                        }
                    },
                    vertexShader: document.getElementById('vertexShader').textContent,
                    fragmentShader: document.getElementById('fragmentShader').textContent
                });
            } else {
                if ((x == -20) || (x == 19) || (z == -20) || (z == 19)) {
                    material = new THREE.ShaderMaterial({
                        uniforms: {
                            normalcolor: {
                                value: [0.4, 0.4, 0.4]
                            },
                            heightcolor: {
                                value: [0.4, 0.4, 0.4]
                            }
                        },
                        vertexShader: document.getElementById('vertexShader').textContent,
                        fragmentShader: document.getElementById('fragmentShader').textContent
                    });
                } else {
                    material = new THREE.ShaderMaterial({
                        uniforms: {
                            normalcolor: {
                                value: normalparam
                            },
                            heightcolor: {
                                value: colorparam
                            }
                        },
                        vertexShader: document.getElementById('vertexShader').textContent,
                        fragmentShader: document.getElementById('fragmentShader').textContent
                    });
                }
            }
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            cube.position.set(x, 0, z);

            boxes[x + 20][z + 20] = cube;

            target[x + 20][z + 20] = 0;
            current[x + 20][z + 20] = 0;
            previous[x + 20][z + 20] = 0;
        }
    }
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 5);
    const clock = new THREE.Clock();

    resize();

    const animate = () => {
        requestAnimationFrame(animate);
        let delta = clock.getDelta();
        if (delta > 1 / 40) {
            delta = 1 / 40;
        }
        time += delta;
        renderer.render(scene, camera);
        for (let x = 1; x < 39; x++) {
            for (let z = 1; z < 39; z++) {
                const box = boxes[x][z];
                let match = false;
                for (let i = 0; i < pos.length; i++) {
                    const element = pos[i];
                    if (((Math.floor(element[0] * (38 / window.innerWidth) + 1) + (Math.floor(element[1] * (38 / window.innerHeight) + 1)) * 40) == (x + (z * 40)))) {
                        match = true;
                    }
                }
                if (tryingdrop) {
                    let a = Math.cos(time * 2) * 14 - (x - 20);
                    let b = Math.sin(time * 2) * 14 - (z - 20);
                    if ((Math.sqrt(a * a + b * b) * -20 + 140) > 40) {
                        current[x][z] = 0.1;
                    } else {
                        current[x][z] += (((previous[x - 1][z] + previous[x + 1][z] + previous[x][z - 1] + previous[x][z + 1]) / 2 - current[x][z]) - current[x][z]) * 30 * delta;
                    }
                } else {
                    if ((clicking) && match) {
                        current[x][z] = 1;
                    } else {
                        current[x][z] += (((previous[x - 1][z] + previous[x + 1][z] + previous[x][z - 1] + previous[x][z + 1]) / 2 - current[x][z]) - current[x][z]) * 30 * delta;
                    }
                }
                target[x][z] = current[x][z] * 40;
                if (target[x][z] > 4) {
                    target[x][z] = 4;
                }
                if (target[x][z] < 0) {
                    target[x][z] = 0;
                }
                box.position.y += (target[x][z] - box.position.y) * 4 * delta;
            }
        }
        let temp = previous;
        previous = current;
        current = temp;
    };
    animate();
};
const toggle = (e, boo) => {
    emove(e);
    clicking = boo;
}
const emove = (event) => {
    if (event.type == 'touchstart' || event.type == 'touchend' || event.type == 'touchcancel' || event.type == 'touchmove') {
        pos = [];
        let touches = event.touches || event.changedTouches;
        for (let index = 0; index < touches.length; index++) {
            const touch = touches[index];
            pos.push([touch.pageX, touch.pageY]);
        }
    } else if (event.type == 'mousemove') {
        pos = [[event.clientX, event.clientY]];
    }
}
const resize = () => {
    camera.position.set(0, (window.innerHeight / window.innerWidth) * 3 + 20, (window.innerHeight / window.innerWidth) * 3 + 25);
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
}
const dragenter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    tryingdrop = true;
}
const dragleave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    tryingdrop = false;
}
const drop = (event) => {
    dragleave(event);
    let data = event.dataTransfer.files;
    let file = data[0];
    let reader = new FileReader();
    reader.onload = () => {
        const mg = new Image();
        mg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.height = 40;
            canvas.width = 40;
            const context = canvas.getContext('2d');
            context.drawImage(mg, 0, 0, 40, 40);
            location.replace('?' + canvas.toDataURL());
        }
        mg.src = reader.result;
    }
    reader.readAsDataURL(file);
}