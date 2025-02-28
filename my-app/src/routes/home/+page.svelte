<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Maintenance</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(125deg, #6e48aa 0%, #9d50bb 50%, #6e48aa 100%);
      background-size: 200% 200%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #ffffff;
      padding: 20px;
      animation: gradientBG 15s ease infinite;
      overflow: hidden;
      position: relative;
    }

    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .particle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      animation: float 8s infinite;
      opacity: 0;
    }

    @keyframes float {
      0% {
        transform: translateY(0) translateX(0);
        opacity: 0;
      }
      50% {
        opacity: 0.7;
      }
      100% {
        transform: translateY(-100vh) translateX(20px);
        opacity: 0;
      }
    }

    .container {
      text-align: center;
      padding: 3rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37),
                  0 2px 5px rgba(0, 0, 0, 0.3),
                  0 0 80px rgba(255, 255, 255, 0.1) inset;
      border: 1px solid rgba(255, 255, 255, 0.18);
      width: 90%;
      max-width: 650px;
      margin-bottom: 60px;
      position: relative;
      z-index: 1;
      overflow: hidden;
    }

    .container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 80%);
      z-index: -1;
      animation: shine 8s linear infinite;
    }

    @keyframes shine {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .icon-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 1.5rem;
    }

    .icon {
      font-size: 5.5rem;
      margin-bottom: 1rem;
      animation: float-icon 5s ease-in-out infinite;
      filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.5));
    }

    .icon-glow {
      position: absolute;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: -1;
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
      50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.7; }
    }

    h1 {
      font-size: 2.8rem;
      font-weight: 600;
      margin-bottom: 1.2rem;
      background: linear-gradient(90deg, #ffffff, #f0f0f0, #ffffff);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shine-text 5s linear infinite;
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
    }

    @keyframes shine-text {
      to { background-position: 200% center; }
    }

    p {
      font-size: 1.2rem;
      font-weight: 300;
      margin-bottom: 2rem;
      line-height: 1.7;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .progress-wrapper {
      position: relative;
      margin-top: 1rem;
    }

    .progress {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 30px;
      height: 12px;
      width: 100%;
      overflow: hidden;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .progress-bar {
      background: linear-gradient(90deg, #4CAF50, #8BC34A, #4CAF50);
      background-size: 200% auto;
      height: 100%;
      width: 0%;
      animation: progress 3s ease-in-out infinite alternate, 
                 gradientMove 3s linear infinite;
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.7);
    }

    .progress-label {
      position: absolute;
      right: 0;
      top: -25px;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      animation: progress-text 3s ease-in-out infinite alternate;
    }

    @keyframes progress {
      0% { width: 5%; }
      50% { width: 70%; }
      100% { width: 95%; }
    }

    @keyframes progress-text {
      0% { content: "5%"; }
      50% { content: "70%"; }
      100% { content: "95%"; }
    }

    @keyframes gradientMove {
      to { background-position: 200% center; }
    }

    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes float-icon {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(5deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }

    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 15px;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(8px);
      text-align: center;
      font-size: 0.9rem;
      letter-spacing: 1px;
      box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.1);
    }

    footer a {
      color: #FFD700;
      text-decoration: none;
      transition: all 0.3s ease;
      position: relative;
      padding: 0 3px;
    }

    footer a::after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      bottom: -2px;
      left: 0;
      background-color: #FFA500;
      transition: width 0.3s ease;
    }

    footer a:hover {
      color: #FFA500;
      transform: translateY(-2px);
    }

    footer a:hover::after {
      width: 100%;
    }

    @media (max-width: 600px) {
      body {
        padding: 15px;
      }
      .container {
        width: 95%;
        padding: 2rem;
        margin-bottom: 50px;
      }
      h1 {
        font-size: 2rem;
      }
      p {
        font-size: 1rem;
      }
      .icon {
        font-size: 4.5rem;
      }
      footer {
        padding: 10px;
        font-size: 0.8rem;
      }
    }
  </style>
</head>
<body>
  <!-- Generate particles dynamically -->
  <div class="particles" id="particles"></div>

  <div class="container">
    <div class="icon-wrapper">
      <div class="icon-glow"></div>
      <div class="icon">🚧</div>
    </div>
    <h1>We're Upgrading Our Site</h1>
    <p>We're working hard to enhance your experience with exciting new features and improvements. Thank you for your patience as we make these changes.</p>
    <div class="progress-wrapper">
      <div class="progress-label">Loading...</div>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
    </div>
  </div>
  
  <footer>
    <p>© 2025 | Crafted with ❤️ by <a href="https://github.com/tony007x">Tony219y</a> & <a href="https://github.com/Gal1leo2">Gal1leo</a> | CS, KMITL</p>
  </footer>

  <script>
    // Create particles
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
      createParticle();
    }

    function createParticle() {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      
      // Random size between 5px and 15px
      const size = Math.random() * 10 + 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      const posX = Math.random() * 100;
      const posY = Math.random() * 100 + 100;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      
      // Random animation duration and delay
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      
      particlesContainer.appendChild(particle);
      
      // Remove and recreate particle after animation
      setTimeout(() => {
        particle.remove();
        createParticle();
      }, (duration + delay) * 1000);
    }
  </script>
</body>
</html>