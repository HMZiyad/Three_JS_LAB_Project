// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x303030, 10, 50);

const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Remove loading text
setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
}, 1000);

// Camera position
camera.position.set(5, 3, 5);
camera.lookAt(0, 1, 0);

// Custom Shader Material for Wardrobe
const wardrobeVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const wardrobeFragmentShader = `
    uniform sampler2D woodTexture;
    uniform vec3 lightPosition;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vec3 light = normalize(lightPosition - vPosition);
        float diffuse = max(dot(vNormal, light), 0.0);
        
        vec4 texColor = texture2D(woodTexture, vUv * 2.0);
        vec3 ambient = texColor.rgb * 0.3;
        vec3 finalColor = ambient + texColor.rgb * diffuse * 0.7;
        
        // Add subtle specular highlight
        vec3 viewDir = normalize(cameraPosition - vPosition);
        vec3 reflectDir = reflect(-light, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        finalColor += vec3(0.3) * spec;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

let wallLight;
let wallLightIsOn = false;
let wallLightSwitch;
let wallLightMaterial;

function createWallLight() {
    // Light fixture
    const fixtureGeometry = new THREE.BoxGeometry(10, 0.2, 0.2);
    wallLightMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        emissive: 0x000000
    });
    const fixture = new THREE.Mesh(fixtureGeometry, wallLightMaterial);
    fixture.position.set(9.9, 2.5, -2);
    fixture.rotation.y = -Math.PI / 2;
    fixture.castShadow = true;
    scene.add(fixture);

    // Spot light source
    wallLight = new THREE.SpotLight(0xffffff, 0, 10, Math.PI / 4, 0.5, 2);
    wallLight.position.set(9.5, 2.5, -4);
    wallLight.target.position.set(8, 2.5, -2);
    wallLight.castShadow = true;
    scene.add(wallLight);
    scene.add(wallLight.target);

    // Switch
    const switchGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const switchMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    wallLightSwitch = new THREE.Mesh(switchGeometry, switchMaterial);
    wallLightSwitch.position.set(9.9, 1.5, -2);
    wallLightSwitch.rotation.y = -Math.PI / 2;
    wallLightSwitch.userData = { isSwitch: true }; // Custom property for identification
    scene.add(wallLightSwitch);
}

function toggleWallLight() {
    wallLightIsOn = !wallLightIsOn;
    if (wallLightIsOn) {
        wallLight.intensity = 1.5;
        wallLightMaterial.emissive.setHex(0xaaaaaa);
    } else {
        wallLight.intensity = 0;
        wallLightMaterial.emissive.setHex(0x000000);
    }
}

// Texture creation function
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.3, '#A0522D');
    gradient.addColorStop(0.6, '#8B4513');
    gradient.addColorStop(1, '#654321');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add wood grain
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
    ctx.lineWidth = 1;
    for(let i = 0; i < 512; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.sin(i * 0.01) * 5);
        ctx.lineTo(512, i + Math.sin(i * 0.01) * 5);
        ctx.stroke();
    }
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createMarbleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base marble color
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(0.5, '#e8e8e8');
    gradient.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add veins
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.2)';
    ctx.lineWidth = 2;
    for(let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, 0);
        ctx.bezierCurveTo(
            Math.random() * 512, Math.random() * 512,
            Math.random() * 512, Math.random() * 512,
            Math.random() * 512, 512
        );
        ctx.stroke();
    }
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Soft gradient wall
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#e8d5c4');
    gradient.addColorStop(0.5, '#f5e6d8');
    gradient.addColorStop(1, '#e8d5c4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add subtle texture
    for(let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create textures
const woodTexture = createWoodTexture();
const marbleTexture = createMarbleTexture();
const wallTexture = createWallTexture();

// Room creation
function createRoom() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        map: marbleTexture,
        shininess: 100,
        reflectivity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Walls
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        map: wallTexture,
        side: THREE.DoubleSide 
    });
    
    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
    );
    backWall.position.set(0, 5, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);
    
    // Side walls
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
    );
    leftWall.position.set(-10, 5, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
    );
    rightWall.position.set(10, 5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

function addPainting() {
    const paintingGeometry = new THREE.PlaneGeometry(8, 5);
    const paintingTexture = new THREE.TextureLoader().load('window.jpg'); // Replace with actual image path
    const paintingMaterial = new THREE.MeshBasicMaterial({ map: paintingTexture });
    
    const painting = new THREE.Mesh(paintingGeometry, paintingMaterial);
    painting.position.set(-9.5, 4, 0); // Positioning it on the left wall
    painting.rotation.y = Math.PI / 2; // Rotate to fit the wall
    scene.add(painting);
}

// Wardrobe creation
class Wardrobe {
    constructor() {
        this.group = new THREE.Group();
        this.drawers = [];
        this.createWardrobe();
    }

    createWardrobe() {
        // Main body with custom shader
        const bodyGeometry = new THREE.BoxGeometry(3, 4, 1.5);
        const bodyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                woodTexture: { value: woodTexture },
                lightPosition: { value: new THREE.Vector3(5, 5, 5) }
            },
            vertexShader: wardrobeVertexShader,
            fragmentShader: wardrobeFragmentShader
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2;
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);
        
        // Create drawers
        const drawerHeight = 0.7;
        const drawerPositions = [0.5, 1.3, 2.1, 2.9];
        
        drawerPositions.forEach((yPos, index) => {
            const drawer = this.createDrawer(yPos, drawerHeight, index);
            // Add each drawer group directly to the main scene, not the wardrobe body
            scene.add(drawer.group);
            this.drawers.push(drawer);
        });
        
        // Add handles
        this.addHandles();
    }
    
    createDrawer(yPos, height, index) {
        const drawerGroup = new THREE.Group();
        
        const drawerMaterial = new THREE.MeshPhongMaterial({
            map: woodTexture,
            shininess: 30
        });

        // Set the initial position of the drawer group relative to the scene
        // The wardrobe body is at (0, 2, 0), so we offset the drawers accordingly
        drawerGroup.position.set(0, 0, 0.2);

        // Drawer bottom
        const bottom = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.3), drawerMaterial);
        bottom.position.set(0, yPos - height / 2, 0);
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        drawerGroup.add(bottom);

        // Drawer sides and back
        const sideThickness = 0.1;
        const sideHeight = height;
        
        const leftSide = new THREE.Mesh(new THREE.BoxGeometry(sideThickness, sideHeight, 1.3), drawerMaterial);
        leftSide.position.set(-1.4 + sideThickness / 2, yPos, 0);
        leftSide.castShadow = true;
        leftSide.receiveShadow = true;
        drawerGroup.add(leftSide);

        const rightSide = new THREE.Mesh(new THREE.BoxGeometry(sideThickness, sideHeight, 1.3), drawerMaterial);
        rightSide.position.set(1.4 - sideThickness / 2, yPos, 0);
        rightSide.castShadow = true;
        rightSide.receiveShadow = true;
        drawerGroup.add(rightSide);

        const back = new THREE.Mesh(new THREE.BoxGeometry(2.8 - sideThickness * 2, sideHeight, sideThickness), drawerMaterial);
        back.position.set(0, yPos, -0.65 + sideThickness / 2);
        back.castShadow = true;
        back.receiveShadow = true;
        drawerGroup.add(back);

        // Drawer front panel
        const panelGeometry = new THREE.BoxGeometry(2.9, height + 0.05, 0.1);
        const panelMaterial = new THREE.MeshPhongMaterial({
            map: woodTexture,
            shininess: 50
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, yPos, 0.65 - 0.05);
        panel.castShadow = true;
        drawerGroup.add(panel);
        
        return {
            group: drawerGroup,
            panel: panel,
            isOpen: false,
            index: index,
            defaultZ: 0.2, // Corrected defaultZ
            openZ: 1 // Corrected openZ
        };
    }
    
    addHandles() {
        const handleMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        
        this.drawers.forEach(drawer => {
            const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.rotation.z = Math.PI / 2;
            handle.position.set(0, drawer.panel.position.y, drawer.panel.position.z + 0.06);
            handle.castShadow = true;
            drawer.group.add(handle);
        });
    }
    
    toggleDrawer(index) {
        if (index < 0 || index >= this.drawers.length) return;
        
        const drawer = this.drawers[index];
        drawer.isOpen = !drawer.isOpen;
        
        const targetZ = drawer.isOpen ? drawer.openZ : drawer.defaultZ;
        
        const animateDrawer = () => {
            const currentZ = drawer.group.position.z;
            const diff = targetZ - currentZ;
            
            if (Math.abs(diff) > 0.01) {
                drawer.group.position.z += diff * 0.1;
                requestAnimationFrame(animateDrawer);
            } else {
                drawer.group.position.z = targetZ;
            }
        };
        
        animateDrawer();
    }
}

// Decorative elements
function addDecorativeElements() {
    // Plant pot
    const potGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.4, 8);
    const potMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.set(3, 0.2, 3);
    pot.castShadow = true;
    scene.add(pot);
    
    // Plant
    const plantGeometry = new THREE.ConeGeometry(0.4, 1, 6);
    const plantMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);
    plant.position.set(3, 0.9, 3);
    plant.castShadow = true;
    scene.add(plant);
    
    // Picture frame
    const frameGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 3, -9.9);
    frame.castShadow = true;
    scene.add(frame);
    
    // Rug
    const rugGeometry = new THREE.PlaneGeometry(4, 3);
    const rugCanvas = document.createElement('canvas');
    rugCanvas.width = 256;
    rugCanvas.height = 256;
    const rugCtx = rugCanvas.getContext('2d');
    rugCtx.fillStyle = '#8B0000';
    rugCtx.fillRect(0, 0, 256, 256);
    rugCtx.strokeStyle = '#FFD700';
    rugCtx.lineWidth = 10;
    rugCtx.strokeRect(20, 20, 216, 216);
    
    const rugTexture = new THREE.Texture(rugCanvas);
    rugTexture.needsUpdate = true;
    const rugMaterial = new THREE.MeshPhongMaterial({ map: rugTexture });
    const rug = new THREE.Mesh(rugGeometry, rugMaterial);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, 2);
    scene.add(rug);
    
    // Lamp
    const lampBaseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.2, 8);
    const lampBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const lampBase = new THREE.Mesh(lampBaseGeometry, lampBaseMaterial);
    lampBase.position.set(-3, 0.1, -3);
    lampBase.castShadow = true;
    scene.add(lampBase);
    
    const lampPoleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
    const lampPole = new THREE.Mesh(lampPoleGeometry, lampBaseMaterial);
    lampPole.position.set(-3, 1.1, -3);
    lampPole.castShadow = true;
    scene.add(lampPole);
    
    const lampShadeGeometry = new THREE.ConeGeometry(0.5, 0.6, 6);
    const lampShadeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFDD,
        emissive: 0xFFFF88,
        emissiveIntensity: 0.2
    });
    const lampShade = new THREE.Mesh(lampShadeGeometry, lampShadeMaterial);
    lampShade.position.set(-3, 2.1, -3);
    scene.add(lampShade);

    // NEW ITEMS: Desk, Chair, Bookshelf, Desk Lamp
    function createDesk() {
        const deskGeometry = new THREE.BoxGeometry(4, 1.5, 2);
        const deskMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(-5, 0.75, -8);
        desk.castShadow = true;
        desk.receiveShadow = true;
        scene.add(desk);

        // Add a simple laptop on the desk
        const laptopBodyGeometry = new THREE.BoxGeometry(1, 0.1, 0.8);
        const laptopMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const laptopBody = new THREE.Mesh(laptopBodyGeometry, laptopMaterial);
        laptopBody.position.set(-5, 1.5 + 0.05, -8);
        laptopBody.castShadow = true;
        scene.add(laptopBody);
    }
    createDesk();

    function createChair() {
        const chairBaseGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
        const chairBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        const chairBase = new THREE.Mesh(chairBaseGeometry, chairBaseMaterial);
        chairBase.position.set(5, 0.05, -6);
        chairBase.castShadow = true;
        scene.add(chairBase);

        const chairBackGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
        const chairBack = new THREE.Mesh(chairBackGeometry, chairBaseMaterial);
        chairBack.position.set(5, 0.8, -6.7);
        chairBack.castShadow = true;
        scene.add(chairBack);

        const cushionGeometry = new THREE.BoxGeometry(1.4, 0.1, 1.4);
        const cushionMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
        cushion.position.set(5, 0.1, -6);
        cushion.castShadow = true;
        scene.add(cushion);
    }
    // createChair();

    function createBookshelf() {
        const shelfGeometry = new THREE.BoxGeometry(3, 4, 1);
        const shelfMaterial = new THREE.MeshPhongMaterial({ map: woodTexture });
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(8, 2, -9.5);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        scene.add(shelf);

        // Add books
        const bookMaterial = new THREE.MeshPhongMaterial({ color: 0x992222 });
        const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.6), new THREE.MeshPhongMaterial({ color: 0x2A9D8F }));
        book1.position.set(6.8, 2.5, -9.5 + 0.5);
        book1.castShadow = true;
        scene.add(book1);

        const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.7), new THREE.MeshPhongMaterial({ color: 0xE9C46A }));
        book2.position.set(7.2, 2.6, -9.5 + 0.5);
        book2.castShadow = true;
        scene.add(book2);

        const book3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.5), new THREE.MeshPhongMaterial({ color: 0xF4A261 }));
        book3.position.set(7.7, 2.55, -9.5 + 0.5);
        book3.castShadow = true;
        scene.add(book3);
    }
    createBookshelf();
}

// Create room and wardrobe
createRoom();
const wardrobe = new Wardrobe();
scene.add(wardrobe.group);
addDecorativeElements();
//createWallLight(); // Calling the function that was commented out
addPainting(); // Calling the function that was commented out

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(8, 4, 8);
mainLight.castShadow = true;
mainLight.shadow.camera.near = 0.1;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -10;
mainLight.shadow.camera.right = 10;
mainLight.shadow.camera.top = 10;
mainLight.shadow.camera.bottom = -10;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

const pointLight = new THREE.PointLight(0xffaa00, 0.5, 10);
pointLight.position.set(-3, 2.1, -3);
scene.add(pointLight);

// Animation variables
let animateLights = true;
let lightAngle = 0;

// Controls
const keys = {};
let touchStartX = 0;
let touchStartY = 0;

// Keyboard controls
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handleKeyboardMovement() {
    const speed = 0.01;
    if (keys['ArrowUp']) {
        camera.position.z -= speed;
    }
    if (keys['ArrowDown']) {
        camera.position.z += speed;
    }
    if (keys['ArrowLeft']) {
        camera.position.x -= speed;
    }
    if (keys['ArrowRight']) {
        camera.position.x += speed;
    }
    camera.lookAt(0, 1, 0);
}

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check drawer intersections
    wardrobe.drawers.forEach((drawer, index) => {
        const intersects = raycaster.intersectObjects([drawer.panel, drawer.group], true);
        if (intersects.length > 0) {
            wardrobe.toggleDrawer(index);
        }
    });

    // Check switch intersection
    const switchIntersects = raycaster.intersectObjects([wallLightSwitch]);
    if (switchIntersects.length > 0) {
        toggleWallLight();
    }
}

renderer.domElement.addEventListener('click', onMouseClick);

// Touch controls
renderer.domElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Check if touch is on drawer
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    wardrobe.drawers.forEach((drawer, index) => {
        const intersects = raycaster.intersectObjects([drawer.panel, drawer.group], true);
        if (intersects.length > 0) {
            wardrobe.toggleDrawer(index);
        }
    });
});

renderer.domElement.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    camera.position.x -= deltaX * 0.01;
    camera.position.z -= deltaY * 0.01;
    camera.lookAt(0, 1, 0);
    
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

// Toggle animation button
document.getElementById('toggleAnimation').addEventListener('click', () => {
    animateLights = !animateLights;
});

// Window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    handleKeyboardMovement();
    
    // Animate lights
    if (animateLights) {
        lightAngle += 0.01;
        mainLight.position.x = Math.cos(lightAngle) * 10;
        mainLight.position.z = Math.sin(lightAngle) * 10;
        mainLight.position.y = 10 + Math.sin(lightAngle * 2) * 4;
        
        // Update shader uniform
        wardrobe.group.children.forEach(child => {
            if (child.material && child.material.uniforms) {
                child.material.uniforms.lightPosition.value = mainLight.position;
            }
        });
    }
    
    renderer.render(scene, camera);
}

animate();