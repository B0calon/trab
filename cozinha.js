const vertexShaderSource = `
    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;
    
    varying vec3 v_normal;
    varying vec2 v_texcoord;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    
    uniform mat4 u_modelViewMatrix;
    uniform mat4 u_viewingMatrix;
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_inverseTransposeModelViewMatrix;

    uniform vec3 u_lightPosition;
    uniform vec3 u_viewPosition;

    void main() {
        gl_Position = u_projectionMatrix * u_viewingMatrix * u_modelViewMatrix * vec4(a_position,1.0);
        v_normal = normalize(mat3(u_inverseTransposeModelViewMatrix) * a_normal);
        vec3 surfacePosition = (u_modelViewMatrix * vec4(a_position, 1)).xyz;
        v_texcoord = a_texcoord;
        v_surfaceToLight = u_lightPosition - surfacePosition;
        v_surfaceToView = u_viewPosition - surfacePosition;
    }
`;

// Fragment shader source code (Igual ao da professora, com pequeno ajuste na luz ambiente)
const fragmentShaderSource = `
    precision mediump float;

    varying vec3 v_normal;
    varying vec2 v_texcoord;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    uniform sampler2D u_texture;

    void main() {
        vec4 tex = texture2D(u_texture, v_texcoord);
        vec3 baseColor = tex.rgb;

        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(v_surfaceToLight);
        vec3 viewDir  = normalize(v_surfaceToView);
        vec3 halfVec  = normalize(lightDir + viewDir);

        float diffuse = max(dot(lightDir, normal), 0.0);
        float specular = 0.0;
        if (diffuse > 0.0) {
            specular = pow(max(dot(normal, halfVec), 0.0), 50.0);
        }

        // Ajustei um pouco a luz ambiente para a cozinha não ficar muito escura
        vec3 ambient  = 0.4 * baseColor;
        vec3 diffuseC = 0.6 * diffuse * baseColor;
        vec3 specularC = specular * vec3(1.0);

        gl_FragColor = vec4(ambient + diffuseC + specularC, tex.a);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// =========================================================
// SUBSTITUIÇÃO: CreateCube em vez de CreateSphere
// =========================================================
function createCube() {
  // Cubo 1x1x1 centrado na origem
  const positions = [
    // Frente
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // Trás
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
    // Topo
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // Base
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
    // Direita
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
    // Esquerda
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
  ];

  const normals = [
     0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1, // Frente
     0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1, // Trás
     0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0, // Topo
     0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0, // Base
     1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0, // Direita
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, // Esquerda
  ];

  const texcoords = [
    0,0, 1,0, 1,1, 0,1, // Frente
    1,0, 1,1, 0,1, 0,0, // Trás
    0,1, 0,0, 1,0, 1,1, // Topo
    1,1, 0,1, 0,0, 1,0, // Base
    1,0, 1,1, 0,1, 0,0, // Direita
    0,0, 1,0, 1,1, 0,1, // Esquerda
  ];

  const indices = [
     0, 1, 2,   0, 2, 3,    // Frente
     4, 5, 6,   4, 6, 7,    // Trás
     8, 9,10,   8,10,11,    // Topo
    12,13,14,  12,14,15,    // Base
    16,17,18,  16,18,19,    // Direita
    20,21,22,  20,22,23     // Esquerda
  ];

  return { positions, normals, texcoords, indices };
}

// Função auxiliar para graus -> radianos
function degToRad(d) { return d * Math.PI / 180; }

function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) { console.error('WebGL not supported'); return; }

    // Compilação dos Shaders
    const program = createProgram(gl, 
        createShader(gl, gl.VERTEX_SHADER, vertexShaderSource), 
        createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    );
    gl.useProgram(program);

    // Buffers do Cubo
    const cubeData = createCube();

    const VertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData.positions), gl.STATIC_DRAW);

    const NormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData.normals), gl.STATIC_DRAW);

    const TexcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, TexcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData.texcoords), gl.STATIC_DRAW);

    const IndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeData.indices), gl.STATIC_DRAW);

    // Localização dos atributos e uniforms
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const normalLocation = gl.getAttribLocation(program, 'a_normal');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');

    const uModelView = gl.getUniformLocation(program, 'u_modelViewMatrix');
    const uView = gl.getUniformLocation(program, 'u_viewingMatrix');
    const uProj = gl.getUniformLocation(program, 'u_projectionMatrix');
    const uInvTrans = gl.getUniformLocation(program, 'u_inverseTransposeModelViewMatrix');
    const uLightPos = gl.getUniformLocation(program, 'u_lightPosition');
    const uViewPos = gl.getUniformLocation(program, 'u_viewPosition');
    const uTexture = gl.getUniformLocation(program, 'u_texture');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.2, 0.2, 0.2, 1.0); // Fundo cinza escuro

    // =========================================================
    // CARREGAMENTO DE TEXTURAS (Múltiplas)
    // =========================================================
    // Função helper para carregar textura de forma assíncrona segura
    function loadTexture(url) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Preenche com 1 pixel azul enquanto carrega
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        
        const image = new Image();
        image.src = url;
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            // Configurações para texturas que não são potência de 2
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        };
        return texture;
    }

    // Carregue suas imagens aqui (certifique-se que os nomes batem com seus arquivos)
    const textures = {
        floor: loadTexture('images/floor.jpg'),  // Substitua pelos nomes dos seus arquivos
        wall: loadTexture('images/wall.png'),
        wood: loadTexture('images/island.jpg'),
        door: loadTexture('images/door.jpg'),
        metal: loadTexture('images/refrigerator.jpg') 
        // Use 'earth.jpeg' se não tiver as outras para testar: loadTexture('earth.jpeg')
    };

    // =========================================================
    // CONTROLES DE CÂMERA
    // =========================================================
    let camX = 0, camY = 20, camZ = 80;
    let camYaw = 0;
    const keys = {};

    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    // =========================================================
    // FUNÇÃO DE DESENHO DO CUBO (Reutilizável)
    // =========================================================
    function drawCube(texture, tx, ty, tz, sx, sy, sz) {
        // Habilita atributos
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(normalLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, NormalBuffer);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(texcoordLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, TexcoordBuffer);
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IndexBuffer);

        // Transformações (Translate -> Rotate -> Scale)
        let model = m4.identity();
        model = m4.translate(model, tx, ty, tz);
        model = m4.scale(model, sx, sy, sz);

        // Matriz normal (Inversa Transposta)
        let invTranspose = m4.transpose(m4.inverse(model));

        // Envia Uniforms
        gl.uniformMatrix4fv(uModelView, false, model);
        gl.uniformMatrix4fv(uInvTrans, false, invTranspose);

        // Bind da Textura
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTexture, 0);

        // Desenha
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

    // =========================================================
    // LOOP DE RENDERIZAÇÃO
    // =========================================================
    function drawScene() {
        // Movimento
        if (keys['w']) camZ -= 1;
        if (keys['s']) camZ += 1;
        if (keys['a']) camX -= 1;
        if (keys['d']) camX += 1;
        if (keys['ArrowLeft']) camYaw += 0.05;
        if (keys['ArrowRight']) camYaw -= 0.05;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Configuração da Projeção (Perspective manual baseada em Frustum)
        // A função setPerspectiveProjectionMatrix da professora é meio complexa (Frustum),
        // vamos calcular os bounds para simular um FOV de 60 graus.
        const aspect = gl.canvas.width / gl.canvas.height;
        const zNear = 1;
        const zFar = 2000;
        const fieldOfViewRadians = degToRad(60);
        const top = Math.tan(fieldOfViewRadians * 0.5) * zNear;
        const bottom = -top;
        const right = top * aspect;
        const left = -right;

        // Projeção: Note que m4.js usa setPerspectiveProjectionMatrix com min/max
        const projectionMatrix = m4.setPerspectiveProjectionMatrix(left, right, bottom, top, zNear, zFar);

        // Configuração da Câmera (LookAt)
        const target = [
            camX + Math.sin(camYaw), 
            camY, 
            camZ - Math.cos(camYaw)
        ];
        const up = [0, 1, 0];
        const viewMatrix = m4.setViewingMatrix([camX, camY, camZ], target, up);

        // Envia matrizes globais
        gl.uniformMatrix4fv(uProj, false, projectionMatrix);
        gl.uniformMatrix4fv(uView, false, viewMatrix);
        gl.uniform3fv(uViewPos, [camX, camY, camZ]);
        gl.uniform3fv(uLightPos, [20, 50, 20]); // Luz no teto

        // --- DESENHAR OBJETOS DA COZINHA ---
        // Sintaxe: drawCube(Textura, X, Y, Z, EscalaX, EscalaY, EscalaZ)
        
        // 1. Chão
        drawCube(textures.floor, 0, -1, 0, 100, 1, 100);

        // 2. Paredes
        drawCube(textures.wall,  51, 12,   0,   2, 24, 100); // Direita
        drawCube(textures.wall, -51, 12,   0,   2, 24, 100); // Esquerda
        drawCube(textures.wall,   0, 12, -51, 100, 24,   2); // Fundo

        // 3. Ilha (Mesa central)
        drawCube(textures.wood, 4, 4, -15, 8, 8, 8);

        // 4. Porta
        drawCube(textures.door, -40, 10, -49, 15, 20, 1);

        // 5. Geladeira
        drawCube(textures.metal || textures.wall, 0, 10, -46, 8, 20, 8);

        requestAnimationFrame(drawScene);
    }

    // Inicia o loop
    drawScene();
}

function crossProduct(v1, v2) {
    return [
        v1[1]*v2[2] - v1[2]*v2[1],
        v1[2]*v2[0] - v1[0]*v2[2],
        v1[0]*v2[1] - v1[1]*v2[0]
    ];
}

function unitVector(v){ 
    let mod = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
    return [v[0]/mod, v[1]/mod, v[2]/mod];
}

window.addEventListener('load', main);
