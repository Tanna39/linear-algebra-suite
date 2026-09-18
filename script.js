let curveChartInstance = null;
let convergenceChartInstance = null;
let currentMatrixSize = 3;
let iterationHistory = [];

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const btn1 = document.getElementById('btn-tab1');
    const btn2 = document.getElementById('btn-tab2');
    const btn3 = document.getElementById('btn-tab3');
    [btn1, btn2, btn3].forEach(b => b.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200");

    if(tab === 'tab1') {
        document.getElementById('tab1-content').classList.remove('hidden');
        btn1.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-cyan-600 to-cyan-700 text-slate-950 shadow-lg shadow-cyan-600/20";
        document.getElementById('tab-title').innerText = "Matrix Solvers Engine";
        document.getElementById('tab-desc').innerText = "> Simultaneous matrix solutions via Direct, Iterative and Decomposition frameworks.";
    } else if(tab === 'tab2') {
        document.getElementById('tab2-content').classList.remove('hidden');
        btn2.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-teal-600 to-teal-700 text-slate-950 shadow-lg shadow-teal-600/20";
        document.getElementById('tab-title').innerText = "Iteration Convergence Analytics";
        document.getElementById('tab-desc').innerText = "> Real-time error metric visualization processing across epoch evaluations.";
        setTimeout(renderConvergenceChart, 50);
    } else {
        document.getElementById('tab3-content').classList.remove('hidden');
        btn3.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20";
        document.getElementById('tab-title').innerText = "Curve Fitter Canvas";
        document.getElementById('tab-desc').innerText = "> Continuous optimal trendlines modeled via Least Squares Regression analysis.";
        setTimeout(generateCurveFit, 50); 
    }
}

function buildMatrixInputs() {
    const container = document.getElementById('matrix-container');
    const outputGrid = document.getElementById('vector-outputs-grid');
    container.innerHTML = '';
    outputGrid.innerHTML = '';
    
    outputGrid.style.display = 'grid';
    outputGrid.style.gridTemplateColumns = `repeat(${currentMatrixSize}, minmax(0, 1fr))`;

    for (let i = 0; i < currentMatrixSize; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = "flex items-center gap-2";
        let innerHTML = '';
        for (let j = 0; j < currentMatrixSize; j++) {
            let val = (i === j) ? (8 + i * 2) : 1; 
            innerHTML += `<input type="number" id="a_${i}_${j}" value="${val}" oninput="inspectMatrixProperties()" class="w-12 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-xs font-mono text-white focus:outline-none focus:border-cyan-500">`;
        }
        let bVal = (12 + i * 4);
        innerHTML += `
            <span class="text-slate-600 font-bold text-xs">═</span>
            <input type="number" id="b_${i}" value="${bVal}" oninput="inspectMatrixProperties()" class="w-14 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-xs font-mono text-cyan-400 font-bold focus:outline-none">
        `;
        rowDiv.innerHTML = innerHTML;
        container.appendChild(rowDiv);

        const outBox = document.createElement('div');
        outBox.className = "glass-card p-4 rounded-xl border border-slate-800 text-center";
        outBox.innerHTML = `
            <p class="text-[9px] uppercase font-bold tracking-widest text-slate-500">Vector X${i+1}</p>
            <p id="res-x${i}" class="text-md font-black text-white font-mono mt-1">-</p>
        `;
        outputGrid.appendChild(outBox);
    }
    inspectMatrixProperties();
}

function adjustMatrixSize(delta) {
    let target = currentMatrixSize + delta;
    if (target >= 2 && target <= 4) { 
        currentMatrixSize = target;
        document.getElementById('matrix-size-display').innerText = `${target}×${target}`;
        buildMatrixInputs();
    }
}

function computeDeterminant(matrix) {
    let n = matrix.length;
    let mat = JSON.parse(JSON.stringify(matrix));
    let det = 1;
    for (let i = 0; i < n; i++) {
        let pivotRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(mat[j][i]) > Math.abs(mat[pivotRow][i])) pivotRow = j;
        }
        if (pivotRow !== i) {
            let temp = mat[i]; mat[i] = mat[pivotRow]; mat[pivotRow] = temp;
            det *= -1;
        }
        if (Math.abs(mat[i][i]) < 1e-9) return 0;
        det *= mat[i][i];
        for (let j = i + 1; j < n; j++) {
            let factor = mat[j][i] / mat[i][i];
            for (let k = i; k < n; k++) mat[j][k] -= factor * mat[i][k];
        }
    }
    return det;
}

function inspectMatrixProperties() {
    let n = currentMatrixSize;
    let A = [];
    for(let i=0; i<n; i++) {
        let r = [];
        for(let j=0; j<n; j++) r.push(parseFloat(document.getElementById(`a_${i}_${j}`).value) || 0);
        A.push(r);
    }

    let det = computeDeterminant(A);
    document.getElementById('diag-det').innerText = det.toFixed(2);
    const badge = document.getElementById('badge-det');
    if(Math.abs(det) < 1e-5) {
        badge.innerText = "Singular Matrix";
        badge.className = "px-2 py-1 text-[9px] font-mono font-bold rounded bg-rose-950 text-rose-400 border border-rose-900";
    } else {
        badge.innerText = "Non-Singular";
        badge.className = "px-2 py-1 text-[9px] font-mono font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-900";
    }

    let isDominant = true;
    for(let i=0; i<n; i++) {
        let diag = Math.abs(A[i][i]);
        let sum = 0;
        for(let j=0; j<n; j++) { if(j !== i) sum += Math.abs(A[i][j]); }
        if(diag <= sum) isDominant = false;
    }
    const domEl = document.getElementById('diag-dominance');
    if(isDominant) {
        domEl.innerText = "Diagonally Dominant (Highly Stable)";
        domEl.className = "text-xs font-bold font-mono mt-1 text-emerald-400";
    } else {
        domEl.innerText = "Non-Dominant System (Risk of Divergence)";
        domEl.className = "text-xs font-bold font-mono mt-1 text-amber-500";
    }
}

function solveMatrix() {
    let n = currentMatrixSize;
    let A = [], B = [];
    for(let i=0; i<n; i++) {
        let r = [];
        for(let j=0; j<n; j++) r.push(parseFloat(document.getElementById(`a_${i}_${j}`).value) || 0);
        A.push(r);
        B.push(parseFloat(document.getElementById(`b_${i}`).value) || 0);
    }

    const method = document.getElementById('matrix-method').value;
    const stepsDiv = document.getElementById('matrix-steps');
    const inverseContainer = document.getElementById('inverse-matrix-container');
    const inverseGrid = document.getElementById('inverse-output-grid');
    
    stepsDiv.innerHTML = '';
    iterationHistory = [];
    
    inverseContainer.classList.add('hidden');
    inverseGrid.innerHTML = '';
    for(let i=0; i<n; i++) document.getElementById(`res-x${i}`).parentNode.classList.remove('hidden');

    if (method === 'inverse') {
        stepsDiv.innerHTML += `[INVERSE] Initializing Gauss-Jordan Inversion Algorithm...<br>`;
        stepsDiv.innerHTML += `&bull; Appending Identity Matrix [I] next to [A] &rarr; [A | I]<br>`;
        
        let aug = [];
        for (let i = 0; i < n; i++) {
            let row = [...A[i]];
            for (let j = 0; j < n; j++) row.push(i === j ? 1 : 0);
            aug.push(row);
        }

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
            }
            if (maxRow !== i) {
                let temp = aug[i]; aug[i] = aug[maxRow]; aug[maxRow] = temp;
                stepsDiv.innerHTML += `&bull; Swapped Row ${i+1} with Row ${maxRow+1} for numerical stability.<br>`;
            }

            let pivot = aug[i][i];
            if (Math.abs(pivot) < 1e-9) {
                stepsDiv.innerHTML += `<span class="text-rose-500">[ERROR] Matrix is Singular (|A|=0). Inversion impossible.</span>`;
                return;
            }

            for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
            stepsDiv.innerHTML += `&bull; Normalized Row ${i+1} via pivot value (${pivot.toFixed(3)})<br>`;

            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    let factor = aug[j][i];
                    for (let k = 0; k < 2 * n; k++) aug[j][k] -= factor * aug[i][k];
                    stepsDiv.innerHTML += `&bull; Row ${j+1} &larr; Row ${j+1} - (${factor.toFixed(3)}) &times; Row ${i+1}<br>`;
                }
            }
        }

        inverseContainer.classList.remove('hidden');
        inverseGrid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
        stepsDiv.innerHTML += `[SUCCESS] Reduced Echelon space achieved. Extracting inverted block:<br>`;
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                let invVal = aug[i][j + n];
                if (Math.abs(invVal) < 1e-9) invVal = 0;
                let cell = document.createElement('div');
                cell.className = "bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-bold text-cyan-400";
                cell.innerText = invVal.toFixed(4);
                inverseGrid.appendChild(cell);
            }
            document.getElementById(`res-x${i}`).parentNode.classList.add('hidden');
        }
        return;
    }

    if (method === 'gauss') {
        stepsDiv.innerHTML += `[GAUSS TRACE] Initiating elimination with Partial Pivoting...<br>`;
        let matA = JSON.parse(JSON.stringify(A)), matB = [...B];
        
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for(let k = i+1; k < n; k++) {
                if(Math.abs(matA[k][i]) > Math.abs(matA[maxRow][i])) maxRow = k;
            }
            if(maxRow !== i) {
                let tempA = matA[i]; matA[i] = matA[maxRow]; matA[maxRow] = tempA;
                let tempB = matB[i]; matB[i] = matB[maxRow]; matB[maxRow] = tempB;
                stepsDiv.innerHTML += `&bull; Swapped Row ${i+1} with Row ${maxRow+1}<br>`;
            }
            if (Math.abs(matA[i][i]) < 1e-9) { stepsDiv.innerHTML += `<span class="text-rose-500">[ERROR] Singular matrix system detected.</span>`; return; }

            for (let j = i + 1; j < n; j++) {
                let factor = matA[j][i] / matA[i][i];
                stepsDiv.innerHTML += `&bull; Row ${j+1} &larr; Row ${j+1} - (${factor.toFixed(3)}) &times; Row ${i+1}<br>`;
                matB[j] -= factor * matB[i];
                for (let k = i; k < n; k++) matA[j][k] -= factor * matA[i][k];
            }
        }
        let x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) sum += matA[i][j] * x[j];
            x[i] = (matB[i] - sum) / matA[i][i];
        }
        for(let i=0; i<n; i++) document.getElementById(`res-x${i}`).innerText = x[i].toFixed(4);
        stepsDiv.innerHTML += `[SUCCESS] System solutions resolved.`;

    } else if (method === 'lu') {
        stepsDiv.innerHTML += `[LU TRACE] Splitting via Doolittle Algorithm...<br>`;
        let L = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => i === j ? 1 : 0));
        let U = Array.from({length: n}, () => new Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let k = i; k < n; k++) {
                let sum = 0;
                for (let j = 0; j < i; j++) sum += (L[i][j] * U[j][k]);
                U[i][k] = A[i][k] - sum;
            }
            for (let k = i + 1; k < n; k++) {
                let sum = 0;
                for (let j = 0; j < i; j++) sum += (L[k][j] * U[j][i]);
                if(Math.abs(U[i][i]) < 1e-9) { stepsDiv.innerHTML += `<span class="text-rose-500">[ERROR] Main diagonal zero breaks factorization.</span>`; return; }
                L[k][i] = (A[k][i] - sum) / U[i][i];
            }
        }
        let z = new Array(n).fill(0);
        for(let i=0; i<n; i++) {
            let sum = 0;
            for(let j=0; j<i; j++) sum += L[i][j] * z[j];
            z[i] = B[i] - sum;
        }
        let x = new Array(n).fill(0);
        for(let i=n-1; i>=0; i--) {
            let sum = 0;
            for(let j=i+1; j<n; j++) sum += U[i][j] * x[j];
            x[i] = (z[i] - sum) / U[i][i];
        }
        for(let i=0; i<n; i++) document.getElementById(`res-x${i}`).innerText = x[i].toFixed(4);
        stepsDiv.innerHTML += `[SUCCESS] Output solution structural vectors mapped.`;

    } else if (method === 'cramer') {
        stepsDiv.innerHTML += `[CRAMER ENGINE] Processing parallel determinants...<br>`;
        let mainDet = computeDeterminant(A);
        if(Math.abs(mainDet) < 1e-6) { stepsDiv.innerHTML += `<span class="text-rose-500">[ERROR] Determinant is 0. Cramer's rule aborted.</span>`; return; }
        
        for(let col=0; col<n; col++) {
            let tempMat = JSON.parse(JSON.stringify(A));
            for(let row=0; row<n; row++) tempMat[row][col] = B[row];
            let subDet = computeDeterminant(tempMat);
            let ans = subDet / mainDet;
            document.getElementById(`res-x${col}`).innerText = ans.toFixed(4);
            stepsDiv.innerHTML += `&bull; Det(A_${col+1}) = ${subDet.toFixed(2)} &rarr; X_${col+1} = ${ans.toFixed(4)}<br>`;
        }
        stepsDiv.innerHTML += `[SUCCESS] Calculation complete.`;

    } else if (method === 'seidel' || method === 'jacobi') {
        stepsDiv.innerHTML += `[ITERATIVE RUN] Instantiating loop sequence via ${method.toUpperCase()}...<br>`;
        let x = new Array(n).fill(0);
        let maxSteps = 25;
        let converged = false;

        for (let step = 1; step <= maxSteps; step++) {
            let nextX = [...x];
            let currentStepError = 0;

            for (let i = 0; i < n; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    if (j !== i) sum += A[i][j] * (method === 'jacobi' ? x[j] : nextX[j]);
                }
                if (Math.abs(A[i][i]) < 1e-9) { stepsDiv.innerHTML += `<span class="text-rose-500">[ERROR] Zero diagonal structure.</span>`; return; }
                nextX[i] = (B[i] - sum) / A[i][i];
                currentStepError += Math.pow(nextX[i] - x[i], 2);
            }
            
            currentStepError = Math.sqrt(currentStepError);
            x = [...nextX];
            iterationHistory.push({ step, error: currentStepError });
            stepsDiv.innerHTML += `&bull; Iteration ${step}: Error Vector = ${currentStepError.toFixed(6)}<br>`;
            if(currentStepError < 1e-5) { converged = true; break; }
        }
        if(!converged) stepsDiv.innerHTML += `<span class="text-amber-500">[WARNING] System non-convergent within max epochs limit.</span><br>`;
        for(let i=0; i<n; i++) document.getElementById(`res-x${i}`).innerText = x[i].toFixed(4);
    }
}

function renderConvergenceChart() {
    const canvas = document.getElementById('convergenceChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(convergenceChartInstance) convergenceChartInstance.destroy();

    let labels = iterationHistory.map(h => `Step ${h.step}`);
    let data = iterationHistory.map(h => h.error);

    if(data.length === 0) {
        ctx.fillStyle = "#64748b"; ctx.font = "12px monospace"; ctx.textAlign = "center";
        ctx.fillText("[Run Jacobi or Gauss-Seidel solver to visualize convergence graph]", canvas.width/2, canvas.height/2);
        return;
    }

    convergenceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Residual Error Delta Profile',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderWidth: 2, fill: true, tension: 0.1, pointRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

function generateCurveFit() {
    let pts = [];
    document.querySelectorAll('.point-row').forEach(row => {
        let x = parseFloat(row.querySelector('.pt-x').value);
        let y = parseFloat(row.querySelector('.pt-y').value);
        if(!isNaN(x) && !isNaN(y)) pts.push({ x, y });
    });
    if(pts.length < 2) return;

    const model = document.getElementById('curve-model').value;
    let n = pts.length, linePoints = [], eqText = "";
    let sY = 0, ssTot = 0, ssRes = 0;
    pts.forEach(p => sY += p.y);
    let meanY = sY / n;
    pts.forEach(p => ssTot += Math.pow(p.y - meanY, 2));

    let xVals = pts.map(p => p.x);
    let minX = Math.min(...xVals) - 0.5, maxX = Math.max(...xVals) + 0.5;

    if (model === 'linear') {
        let sX=0, sY_=0, sXY=0, sX2=0;
        pts.forEach(p => { sX += p.x; sY_ += p.y; sXY += p.x*p.y; sX2 += p.x*p.x; });
        let denominator = (n * sX2 - sX * sX);
        if(Math.abs(denominator) < 1e-9) return;
        let a1 = (n * sXY - sX * sY_) / denominator;
        let a0 = (sY_ - a1 * sX) / n;
        eqText = `y = ${a1.toFixed(3)}x + (${a0.toFixed(3)})`;
        for (let i = minX; i <= maxX; i += (maxX-minX)/20) linePoints.push({ x: i, y: (a1 * i + a0) });
        pts.forEach(p => ssRes += Math.pow(p.y - (a1 * p.x + a0), 2));

    } else if (model === 'quadratic') {
        let sX=0, sX2=0, sX3=0, sX4=0, sY_=0, sXY=0, sX2Y=0;
        pts.forEach(p => {
            let x2 = p.x*p.x; sX += p.x; sX2 += x2; sX3 += x2*p.x; sX4 += x2*x2;
            sY_ += p.y; sXY += p.x*p.y; sX2Y += x2*p.y;
        });
        
        let d = n*(sX2*sX4 - sX3*sX3) - sX*(sX*sX4 - sX2*sX3) + sX2*(sX*sX3 - sX2*sX2);
        if(Math.abs(d) < 1e-6) { document.getElementById('fit-equation').innerText = "Collinear point error"; return; }
        
        let d0 = sY_*(sX2*sX4 - sX3*sX3) - sX*(sXY*sX4 - sX3*sX2Y) + sX2*(sXY*sX3 - sX2*sX2Y);
        let d1 = n*(sXY*sX4 - sX3*sX2Y) - sY_*(sX*sX4 - sX2*sX3) + sX2*(sX*sX2Y - sXY*sX2);
        let d2 = n*(sX2*sX2Y - sXY*sX3) - sX*(sX*sX2Y - sY_*sX3) + sY_*(sX*sX3 - sX2*sX2);
        
        let a0 = d0/d, a1 = d1/d, a2 = d2/d;
        eqText = `y = ${a2.toFixed(3)}x² + ${a1.toFixed(3)}x + ${a0.toFixed(3)}`;
        for (let i = minX; i <= maxX; i += (maxX-minX)/20) linePoints.push({ x: i, y: (a2*i*i + a1*i + a0) });
        pts.forEach(p => ssRes += Math.pow(p.y - (a2*p.x*p.x + a1*p.x + a0), 2));

    } else if (model === 'exponential') {
        let sX=0, sYln=0, sXYln=0, sX2=0;
        let valid = true;
        pts.forEach(p => { if(p.y <= 0) valid = false; else { sX += p.x; sYln += Math.log(p.y); sXYln += p.x*Math.log(p.y); sX2 += p.x*p.x; }});
        if(!valid) { document.getElementById('fit-equation').innerText = "Y inputs must be > 0"; return; }
        let denominator = (n * sX2 - sX * sX);
        if(Math.abs(denominator) < 1e-9) return;
        let b = (n * sXYln - sX * sYln) / denominator;
        let a = Math.exp((sYln - b * sX) / n);
        eqText = `y = ${a.toFixed(3)} &bull; e^(${b.toFixed(3)}x)`;
        for (let i = minX; i <= maxX; i += (maxX-minX)/20) linePoints.push({ x: i, y: (a * Math.exp(b * i)) });
        pts.forEach(p => ssRes += Math.pow(p.y - (a * Math.exp(b * p.x)), 2));
    }

    document.getElementById('fit-equation').innerHTML = eqText;
    let r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    if(r2 < 0) r2 = 0; 
    document.getElementById('stat-r2').innerText = r2.toFixed(4);
    document.getElementById('stat-error').innerText = Math.sqrt(ssRes / (n - 2 || 1)).toFixed(4);

    const ctx = document.getElementById('curveChart').getContext('2d');
    if (curveChartInstance) curveChartInstance.destroy();
    curveChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                { label: 'Points', data: pts, backgroundColor: '#06b6d4', pointRadius: 5 },
                { label: 'Regression Path', data: linePoints, type: 'line', borderColor: '#6366f1', borderWidth: 2, pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

function loadPreset(type) {
    if(type === 'dominant') {
        currentMatrixSize = 3; document.getElementById('matrix-size-display').innerText = "3×3"; buildMatrixInputs();
        document.getElementById('a_0_0').value = 10; document.getElementById('a_0_1').value = 1;  document.getElementById('a_0_2').value = 2;  document.getElementById('b_0').value = 13;
        document.getElementById('a_1_0').value = 1;  document.getElementById('a_1_1').value = 12; document.getElementById('a_1_2').value = -3; document.getElementById('b_1').value = 10;
        document.getElementById('a_2_0').value = -2; document.getElementById('a_2_1').value = 3;  document.getElementById('a_2_2').value = 15; document.getElementById('b_2').value = 16;
    } else {
        currentMatrixSize = 3; document.getElementById('matrix-size-display').innerText = "3×3"; buildMatrixInputs();
        document.getElementById('a_0_0').value = 1; document.getElementById('a_0_1').value = 4; document.getElementById('a_0_2').value = 5;  document.getElementById('b_0').value = 6;
        document.getElementById('a_1_0').value = 7; document.getElementById('a_1_1').value = 1; document.getElementById('a_1_2').value = 3;  document.getElementById('b_1').value = 11;
        document.getElementById('a_2_0').value = 4; document.getElementById('a_2_1').value = 8; document.getElementById('a_2_2').value = 1;  document.getElementById('b_2').value = 13;
    }
    inspectMatrixProperties();
}

function addNewRow() {
    const tbody = document.getElementById('dynamic-point-rows');
    const tr = document.createElement('tr');
    tr.className = 'point-row border-b border-slate-800/40';
    // Removed automatic generation call from inputs to follow manual compute flow
    tr.innerHTML = `
        <td class="py-2 pl-2"><input type="number" value="0" class="pt-x w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-cyan-400 focus:outline-none"></td>
        <td class="py-2"><input type="number" value="0" class="pt-y w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-cyan-400 focus:outline-none"></td>
        <td class="py-2 text-center"><button onclick="deleteRow(this)" class="text-rose-500 hover:text-rose-400 transition font-bold text-xs">✕</button></td>
    `;
    tbody.appendChild(tr);
}

function deleteRow(btn) {
    if(document.querySelectorAll('.point-row').length > 2) { 
        btn.closest('tr').remove(); 
        generateCurveFit(); // Automatically updates graph output after nodes subtraction
    }
}

function exportLog() {
    const blob = new Blob([document.getElementById('matrix-steps').innerText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Computational_Suite_Trace.txt';
    link.click();
}

window.onload = function() { buildMatrixInputs(); switchTab('tab1'); };