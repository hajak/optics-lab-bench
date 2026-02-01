const App = {
    currentLabIndex: 0,
    currentStepIndex: 0,
    isInFreeMode: false,
    isDarkMode: false,

    labs: [
        { id: 'plane-mirror', name: 'Plan spegel', module: PlaneMirrorLab },
        { id: 'concave-mirror', name: 'Konkav spegel', module: ConcaveMirrorLab },
        { id: 'convex-mirror', name: 'Konvex spegel', module: ConvexMirrorLab },
        { id: 'convex-lens', name: 'Konvex lins', module: ConvexLensLab },
        { id: 'concave-lens', name: 'Konkav lins', module: ConcaveLensLab },
        { id: 'refraction', name: 'Brytning', module: RefractionLab },
        { id: 'prism', name: 'Prisma', module: PrismLab }
    ],

    init() {
        this.loadTheme();
        this.setupWelcomeScreen();
        this.setupThemeToggle();
        this.setupResizeHandler();
        this.setupCompletionButtons();

        this.labs.forEach(lab => {
            lab.module.init();
            this.setupLabNavigation(lab.id);
        });
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('optik-labbet-theme');
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
            document.body.setAttribute('data-theme', 'dark');
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.textContent = '\u2600\uFE0F';
        }
    },

    setupWelcomeScreen() {
        document.getElementById('startBtn').addEventListener('click', () => {
            document.getElementById('welcomeScreen').classList.add('hidden');
            document.getElementById('labInterface').classList.remove('hidden');
            this.startLab(0);
        });
    },

    setupLabNavigation(labId) {
        const prevBtn = document.getElementById(`prevStep-${labId}`);
        const nextBtn = document.getElementById(`nextStep-${labId}`);
        const continueBtn = document.getElementById(`continueToNext-${labId}`);

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (continueBtn) continueBtn.addEventListener('click', () => this.goToNextLab());
    },

    setupThemeToggle() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;

            if (this.isDarkMode) {
                document.body.setAttribute('data-theme', 'dark');
                document.getElementById('themeToggle').textContent = '\u2600\uFE0F';
                localStorage.setItem('optik-labbet-theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
                document.getElementById('themeToggle').textContent = '\uD83C\uDF19';
                localStorage.setItem('optik-labbet-theme', 'light');
            }

            this.labs.forEach(lab => lab.module.setDarkMode(this.isDarkMode));
        });
    },

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentLab = this.labs[this.currentLabIndex];
                if (currentLab && currentLab.module) {
                    currentLab.module.resize();
                }
            }, 100);
        });
    },

    setupCompletionButtons() {
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.currentLabIndex = 0;
            this.currentStepIndex = 0;
            this.isInFreeMode = false;
            document.getElementById('completion-screen').classList.remove('active');
            this.startLab(0);
        });

        document.getElementById('freeExploreBtn').addEventListener('click', () => {
            this.enterFreeExploreMode();
        });

        // Quiz buttons
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            document.getElementById('completion-screen').classList.remove('active');
            document.getElementById('quiz-screen').classList.add('active');
        });

        document.getElementById('backToCompletionBtn').addEventListener('click', () => {
            document.getElementById('quiz-screen').classList.remove('active');
            document.getElementById('completion-screen').classList.add('active');
        });

        document.getElementById('quizFreeExploreBtn').addEventListener('click', () => {
            document.getElementById('quiz-screen').classList.remove('active');
            this.enterFreeExploreMode();
        });
    },

    startLab(labIndex) {
        this.currentLabIndex = labIndex;
        this.currentStepIndex = 0;
        this.isInFreeMode = false;

        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        const lab = this.labs[labIndex];
        document.getElementById(`${lab.id}-lab`).classList.add('active');

        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        this.updateProgress();
        this.updateGuidedContent();
        this.showGuidedPanel();
    },

    updateProgress() {
        const totalLabs = this.labs.length;
        const progress = (this.currentLabIndex / totalLabs) * 100;

        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `Laboration ${this.currentLabIndex + 1}/${totalLabs}`;
    },

    getCurrentSteps() {
        const lab = this.labs[this.currentLabIndex];
        return lab.module.guidedSteps || [];
    },

    getLabId() {
        return this.labs[this.currentLabIndex].id;
    },

    updateGuidedContent() {
        const steps = this.getCurrentSteps();
        const step = steps[this.currentStepIndex];
        const labId = this.getLabId();

        if (!step) return;

        document.getElementById(`guidedText-${labId}`).textContent = step.text;
        document.getElementById(`guideTitle-${labId}`).textContent = step.concept || 'Handledning';
        document.getElementById(`stepIndicator-${labId}`).textContent = `Steg ${this.currentStepIndex + 1}/${steps.length}`;

        document.getElementById(`prevStep-${labId}`).disabled = this.currentStepIndex === 0;

        const isLastStep = this.currentStepIndex === steps.length - 1;
        const nextBtn = document.getElementById(`nextStep-${labId}`);

        if (isLastStep) {
            nextBtn.textContent = 'Avsluta guiden \u2192';
        } else {
            nextBtn.textContent = 'Nästa \u2192';
        }
    },

    nextStep() {
        const steps = this.getCurrentSteps();

        if (this.currentStepIndex < steps.length - 1) {
            this.currentStepIndex++;
            this.updateGuidedContent();
        } else {
            this.enterFreeMode();
        }
    },

    previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.updateGuidedContent();
        }
    },

    enterFreeMode() {
        this.isInFreeMode = true;
        const labId = this.getLabId();

        document.getElementById(`guidedContent-${labId}`).style.display = 'none';
        document.getElementById(`freeModeIndicator-${labId}`).classList.remove('hidden');

        const isLastLab = this.currentLabIndex === this.labs.length - 1;
        const continueBtn = document.getElementById(`continueToNext-${labId}`);

        if (isLastLab) {
            continueBtn.textContent = 'Avsluta alla laborationer \u2192';
        } else {
            continueBtn.textContent = `Fortsätt till ${this.labs[this.currentLabIndex + 1].name} \u2192`;
        }
    },

    showGuidedPanel() {
        const labId = this.getLabId();
        const guidedContent = document.getElementById(`guidedContent-${labId}`);
        const freeModeIndicator = document.getElementById(`freeModeIndicator-${labId}`);

        if (guidedContent) guidedContent.style.display = 'flex';
        if (freeModeIndicator) freeModeIndicator.classList.add('hidden');
    },

    goToNextLab() {
        if (this.currentLabIndex < this.labs.length - 1) {
            this.startLab(this.currentLabIndex + 1);
        } else {
            this.showCompletionScreen();
        }
    },

    showCompletionScreen() {
        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        document.getElementById('completion-screen').classList.add('active');

        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('progressText').textContent = 'Klart!';
    },

    enterFreeExploreMode() {
        document.getElementById('completion-screen').classList.remove('active');

        this.currentLabIndex = 0;
        document.getElementById(`${this.labs[0].id}-lab`).classList.add('active');

        const labId = this.labs[0].id;
        document.getElementById(`guidedContent-${labId}`).style.display = 'none';

        const freeIndicator = document.getElementById(`freeModeIndicator-${labId}`);
        freeIndicator.classList.remove('hidden');
        freeIndicator.innerHTML = `
            <span>\uD83C\uDFAE Fritt utforskande - välj laboration:</span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                ${this.labs.map((lab, i) => `
                    <button class="btn-small" onclick="App.switchToLab(${i})">${lab.name}</button>
                `).join('')}
            </div>
        `;

        this.labs[0].module.resize();
        document.getElementById('progressText').textContent = 'Fritt läge';
    },

    switchToLab(labIndex) {
        document.querySelectorAll('.lab-section').forEach(section => {
            section.classList.remove('active');
        });

        const lab = this.labs[labIndex];
        document.getElementById(`${lab.id}-lab`).classList.add('active');

        this.currentLabIndex = labIndex;
        lab.module.resize();
        lab.module.setDarkMode(this.isDarkMode);

        const labId = lab.id;
        document.getElementById(`guidedContent-${labId}`).style.display = 'none';

        const freeIndicator = document.getElementById(`freeModeIndicator-${labId}`);
        freeIndicator.classList.remove('hidden');
        freeIndicator.innerHTML = `
            <span>\uD83C\uDFAE Fritt utforskande - välj laboration:</span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                ${this.labs.map((l, i) => `
                    <button class="btn-small${i === labIndex ? ' active' : ''}" onclick="App.switchToLab(${i})">${l.name}</button>
                `).join('')}
            </div>
        `;

        document.getElementById('progressText').textContent = `${lab.name} - Fritt läge`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
