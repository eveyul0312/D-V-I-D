import React, { useState, useEffect } from 'react';
import { Camera, Activity, Target, TrendingUp, CheckCircle, ArrowRight, User, Heart, Home, Calendar, BarChart3, Play, Pause, Award, Zap } from 'lucide-react';

const SpineCoachApp = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [userProfile, setUserProfile] = useState({
    name: '',
    age: '',
    discType: '',
    painLevel: 5,
    goals: []
  });

  // 세션 타이머
  useEffect(() => {
    let interval;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  // 스플래시 화면 자동 전환
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => setCurrentScreen('welcome'), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 온보딩 단계
  const onboardingSteps = [
    {
      title: "반갑습니다!",
      subtitle: "디스크 건강 관리의 첫 걸음",
      description: "AI가 당신만의 맞춤형 운동 계획을 만들어드립니다",
      icon: <Heart className="onboarding-icon" />
    },
    {
      title: "기본 프로필",
      subtitle: "당신에 대해 알려주세요",
      description: "나이, 성별, 키, 체중 등 기본 정보",
      fields: ['name', 'age', 'height', 'weight']
    },
    {
      title: "건강 상태",
      subtitle: "현재 디스크 상태를 선택해주세요",
      description: "정확한 진단으로 더 나은 계획을 세울 수 있어요",
      options: [
        { id: 'cervical', label: '경추 디스크 (목)', icon: '🦴' },
        { id: 'lumbar', label: '요추 디스크 (허리)', icon: '💪' },
        { id: 'thoracic', label: '흉추 디스크 (등)', icon: '🫁' },
        { id: 'prevention', label: '예방 목적', icon: '✨' }
      ]
    },
    {
      title: "통증 수준",
      subtitle: "현재 통증 정도를 알려주세요",
      description: "1~10 사이의 숫자로 표현해주세요",
      type: 'slider'
    },
    {
      title: "목표 설정",
      subtitle: "어떤 목표를 이루고 싶으신가요?",
      description: "여러 개 선택 가능합니다",
      options: [
        { id: 'pain', label: '통증 완화', icon: '💆' },
        { id: 'posture', label: '자세 교정', icon: '🧘' },
        { id: 'strength', label: '근력 강화', icon: '💪' },
        { id: 'flexibility', label: '유연성 향상', icon: '🤸' }
      ]
    }
  ];

  // 스플래시 화면
  const SplashScreen = () => (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <div className="spine-icon">
            <div className="vertebra"></div>
            <div className="vertebra"></div>
            <div className="vertebra"></div>
            <div className="vertebra"></div>
            <div className="vertebra"></div>
          </div>
        </div>
        <h1 className="splash-title">SpineAI</h1>
        <p className="splash-subtitle">당신의 척추 건강 파트너</p>
      </div>
    </div>
  );

  // 웰컴 화면
  const WelcomeScreen = () => (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-hero">
          <div className="hero-illustration">
            <div className="posture-guide">
              <div className="person-silhouette">
                <div className="head"></div>
                <div className="spine-line"></div>
                <div className="shoulders"></div>
              </div>
            </div>
          </div>
          <h1 className="welcome-title">디스크 건강,<br/>AI가 함께합니다</h1>
          <p className="welcome-description">
            맞춤형 운동 코칭과 실시간 자세 교정으로<br/>
            통증 없는 일상을 시작하세요
          </p>
        </div>
        <div className="welcome-features">
          <div className="feature-card">
            <Activity className="feature-icon" />
            <h3>실시간 코칭</h3>
            <p>AI가 당신의 움직임을 분석하고 즉시 피드백</p>
          </div>
          <div className="feature-card">
            <Target className="feature-icon" />
            <h3>맞춤형 계획</h3>
            <p>당신만의 상태에 최적화된 운동 프로그램</p>
          </div>
          <div className="feature-card">
            <TrendingUp className="feature-icon" />
            <h3>진행 추적</h3>
            <p>매일매일 나아지는 건강 상태를 확인</p>
          </div>
        </div>
        <button 
          className="primary-button"
          onClick={() => setCurrentScreen('onboarding')}
        >
          시작하기
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // 온보딩 화면
  const OnboardingScreen = () => {
    const step = onboardingSteps[onboardingStep];
    const progress = ((onboardingStep + 1) / onboardingSteps.length) * 100;

    return (
      <div className="onboarding-screen">
        <div className="onboarding-header">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="step-indicator">{onboardingStep + 1} / {onboardingSteps.length}</p>
        </div>

        <div className="onboarding-content">
          {step.icon && <div className="step-icon-container">{step.icon}</div>}
          
          <h2 className="step-title">{step.title}</h2>
          <p className="step-subtitle">{step.subtitle}</p>
          <p className="step-description">{step.description}</p>

          {step.type === 'slider' && (
            <div className="pain-level-slider">
              <div className="slider-labels">
                <span>통증 없음</span>
                <span>심한 통증</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={userProfile.painLevel}
                onChange={(e) => setUserProfile({...userProfile, painLevel: parseInt(e.target.value)})}
                className="pain-slider"
              />
              <div className="pain-value">{userProfile.painLevel}</div>
            </div>
          )}

          {step.options && (
            <div className="options-grid">
              {step.options.map(option => (
                <button
                  key={option.id}
                  className={`option-card ${
                    step.title.includes('목표') 
                      ? userProfile.goals.includes(option.id) ? 'selected' : ''
                      : userProfile.discType === option.id ? 'selected' : ''
                  }`}
                  onClick={() => {
                    if (step.title.includes('목표')) {
                      const goals = userProfile.goals.includes(option.id)
                        ? userProfile.goals.filter(g => g !== option.id)
                        : [...userProfile.goals, option.id];
                      setUserProfile({...userProfile, goals});
                    } else {
                      setUserProfile({...userProfile, discType: option.id});
                    }
                  }}
                >
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-label">{option.label}</span>
                  {(step.title.includes('목표') 
                    ? userProfile.goals.includes(option.id)
                    : userProfile.discType === option.id) && (
                    <CheckCircle className="check-icon" size={20} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          {onboardingStep > 0 && (
            <button 
              className="secondary-button"
              onClick={() => setOnboardingStep(onboardingStep - 1)}
            >
              이전
            </button>
          )}
          <button 
            className="primary-button"
            onClick={() => {
              if (onboardingStep < onboardingSteps.length - 1) {
                setOnboardingStep(onboardingStep + 1);
              } else {
                setCurrentScreen('dashboard');
              }
            }}
          >
            {onboardingStep < onboardingSteps.length - 1 ? '다음' : '완료'}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // 대시보드
  const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('home');

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="user-greeting">
            <h2>안녕하세요! 👋</h2>
            <p>오늘도 건강한 하루 되세요</p>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <Zap size={16} />
              <span>7일 연속</span>
            </div>
          </div>
        </div>

        {activeTab === 'home' && (
          <>
            <div className="today-session">
              <div className="session-header">
                <h3>오늘의 운동</h3>
                <span className="session-duration">20분</span>
              </div>
              <div className="session-preview">
                <div className="exercise-list">
                  <div className="exercise-item">
                    <div className="exercise-icon">🧘</div>
                    <div className="exercise-info">
                      <h4>목 스트레칭</h4>
                      <p>5분 • 초급</p>
                    </div>
                  </div>
                  <div className="exercise-item">
                    <div className="exercise-icon">💪</div>
                    <div className="exercise-info">
                      <h4>코어 강화</h4>
                      <p>10분 • 중급</p>
                    </div>
                  </div>
                  <div className="exercise-item">
                    <div className="exercise-icon">🤸</div>
                    <div className="exercise-info">
                      <h4>등 유연성</h4>
                      <p>5분 • 초급</p>
                    </div>
                  </div>
                </div>
                <button 
                  className="start-session-button"
                  onClick={() => setCurrentScreen('session')}
                >
                  <Play size={24} />
                  운동 시작하기
                </button>
              </div>
            </div>

            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Activity size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">주간 활동</p>
                  <h3 className="stat-value">5/7일</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Target size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">완료율</p>
                  <h3 className="stat-value">71%</h3>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">통증 개선</p>
                  <h3 className="stat-value">-30%</h3>
                </div>
              </div>
            </div>

            <div className="progress-section">
              <h3>이번 주 진행 상황</h3>
              <div className="week-calendar">
                {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => (
                  <div key={day} className={`day-cell ${i < 5 ? 'completed' : ''}`}>
                    <span className="day-label">{day}</span>
                    {i < 5 && <CheckCircle size={16} className="day-check" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-insight">
              <div className="insight-header">
                <Zap className="insight-icon" />
                <h3>AI 인사이트</h3>
              </div>
              <p className="insight-text">
                최근 3일간 자세가 20% 개선되었어요! 계속 이대로만 유지하시면 
                2주 후 통증이 크게 감소할 것으로 예상됩니다. 👏
              </p>
            </div>
          </>
        )}

        <div className="bottom-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={24} />
            <span>홈</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={24} />
            <span>일정</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={24} />
            <span>통계</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={24} />
            <span>프로필</span>
          </button>
        </div>
      </div>
    );
  };

  // 운동 세션 화면
  const SessionScreen = () => (
    <div className="session-screen">
      <div className="session-header">
        <button 
          className="back-button"
          onClick={() => {
            setCurrentScreen('dashboard');
            setSessionActive(false);
            setSessionTime(0);
          }}
        >
          ← 나가기
        </button>
        <div className="session-timer">{formatTime(sessionTime)}</div>
      </div>

      <div className="camera-view">
        <div className="skeleton-overlay">
          <div className="pose-points">
            <div className="point head"></div>
            <div className="point shoulder-left"></div>
            <div className="point shoulder-right"></div>
            <div className="point spine-top"></div>
            <div className="point spine-mid"></div>
            <div className="point spine-low"></div>
            <div className="point hip-left"></div>
            <div className="point hip-right"></div>
          </div>
          <div className="alignment-guides">
            <div className="vertical-guide"></div>
          </div>
        </div>
        <div className="camera-placeholder">
          <Camera size={48} />
          <p>카메라 활성화 중...</p>
        </div>
      </div>

      <div className="session-feedback">
        <div className="current-exercise">
          <h3>목 스트레칭</h3>
          <p>왼쪽으로 천천히 숙이세요</p>
        </div>
        
        <div className="posture-feedback good">
          <CheckCircle size={20} />
          <span>자세가 좋아요!</span>
        </div>

        <div className="exercise-progress">
          <div className="progress-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="progress-bg" />
              <circle cx="50" cy="50" r="45" className="progress-bar" style={{ strokeDashoffset: 70 }} />
            </svg>
            <div className="progress-text">
              <span className="reps">3/5</span>
              <span className="label">세트</span>
            </div>
          </div>
        </div>
      </div>

      <div className="session-controls">
        <button 
          className="control-button"
          onClick={() => setSessionActive(!sessionActive)}
        >
          {sessionActive ? <Pause size={32} /> : <Play size={32} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');

        .app-container {
          font-family: 'Noto Sans KR', -apple-system, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Splash Screen */
        .splash-screen {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.5s ease-out;
        }

        .splash-content {
          text-align: center;
          color: white;
        }

        .splash-logo {
          margin-bottom: 2rem;
          animation: pulse 2s ease-in-out infinite;
        }

        .spine-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .vertebra {
          width: 40px;
          height: 16px;
          background: white;
          border-radius: 50%;
          opacity: 0.9;
          animation: vertebraFloat 2s ease-in-out infinite;
        }

        .vertebra:nth-child(2) { animation-delay: 0.1s; }
        .vertebra:nth-child(3) { animation-delay: 0.2s; }
        .vertebra:nth-child(4) { animation-delay: 0.3s; }
        .vertebra:nth-child(5) { animation-delay: 0.4s; }

        @keyframes vertebraFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .splash-title {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          color: white;
          letter-spacing: -1px;
        }

        .splash-subtitle {
          font-size: 1.2rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Welcome Screen */
        .welcome-screen {
          width: 100vw;
          height: 100vh;
          background: #f8f9ff;
          overflow-y: auto;
          animation: slideIn 0.5s ease-out;
        }

        .welcome-content {
          max-width: 500px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .welcome-hero {
          text-align: center;
          margin-bottom: 3rem;
        }

        .hero-illustration {
          margin-bottom: 2rem;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .posture-guide {
          position: relative;
          width: 100px;
          height: 180px;
          animation: float 3s ease-in-out infinite;
        }

        .person-silhouette {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .head {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .spine-line {
          width: 4px;
          height: 120px;
          background: linear-gradient(180deg, #667eea, #764ba2);
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 2px;
        }

        .shoulders {
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          position: absolute;
          top: 45px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 2px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .welcome-title {
          font-size: 2.5rem;
          font-weight: 900;
          color: #1a1a2e;
          line-height: 1.2;
          margin-bottom: 1rem;
          letter-spacing: -1px;
        }

        .welcome-description {
          font-size: 1.1rem;
          color: #64748b;
          line-height: 1.6;
          font-weight: 400;
        }

        .welcome-features {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 30px rgba(102, 126, 234, 0.15);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        .feature-card p {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.5;
        }

        /* Buttons */
        .primary-button {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
        }

        .secondary-button {
          padding: 1rem 2rem;
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        /* Onboarding */
        .onboarding-screen {
          width: 100vw;
          height: 100vh;
          background: #f8f9ff;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.5s ease-out;
        }

        .onboarding-header {
          padding: 1.5rem 2rem;
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .progress-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.5s ease;
        }

        .step-indicator {
          font-size: 0.9rem;
          color: #64748b;
          text-align: right;
        }

        .onboarding-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .step-icon-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .onboarding-icon {
          width: 80px;
          height: 80px;
          color: #667eea;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .step-title {
          font-size: 2rem;
          font-weight: 900;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .step-subtitle {
          font-size: 1.2rem;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .step-description {
          font-size: 1rem;
          color: #64748b;
          text-align: center;
          margin-bottom: 2rem;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }

        .option-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }

        .option-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
        }

        .option-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        }

        .option-icon {
          font-size: 2.5rem;
        }

        .option-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a1a2e;
          text-align: center;
        }

        .check-icon {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          color: #667eea;
        }

        .pain-level-slider {
          margin: 2rem 0;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          color: #64748b;
          font-size: 0.9rem;
        }

        .pain-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, #22c55e, #eab308, #ef4444);
          outline: none;
          -webkit-appearance: none;
        }

        .pain-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          background: white;
          border: 3px solid #667eea;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .pain-value {
          text-align: center;
          margin-top: 1rem;
          font-size: 2rem;
          font-weight: 900;
          color: #667eea;
        }

        .onboarding-actions {
          padding: 1.5rem 2rem;
          background: white;
          display: flex;
          gap: 1rem;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }

        /* Dashboard */
        .dashboard {
          width: 100vw;
          height: 100vh;
          background: #f8f9ff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: fadeIn 0.5s ease-out;
        }

        .dashboard-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .user-greeting h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
        }

        .user-greeting p {
          font-size: 1rem;
          opacity: 0.9;
        }

        .header-stats {
          display: flex;
          gap: 0.5rem;
        }

        .stat-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .dashboard > * {
          flex-shrink: 0;
        }

        .dashboard > *:not(.dashboard-header):not(.bottom-nav) {
          margin: 0 1.5rem;
        }

        .today-session {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          margin-top: -1.5rem;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .session-header h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1a1a2e;
        }

        .session-duration {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .exercise-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .exercise-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9ff;
          border-radius: 12px;
        }

        .exercise-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 12px;
        }

        .exercise-info h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 0.2rem;
        }

        .exercise-info p {
          font-size: 0.85rem;
          color: #64748b;
        }

        .start-session-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .start-session-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(102, 126, 234, 0.4);
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.8rem;
          color: white;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.3rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1a1a2e;
        }

        .progress-section {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .progress-section h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 1rem;
        }

        .week-calendar {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .day-cell {
          aspect-ratio: 1;
          background: #f8f9ff;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          transition: all 0.3s ease;
        }

        .day-cell.completed {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .day-label {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .day-check {
          color: white;
        }

        .ai-insight {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 20px;
          padding: 1.5rem;
          color: white;
          margin-bottom: 5rem;
          box-shadow: 0 4px 30px rgba(245, 87, 108, 0.3);
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .insight-icon {
          width: 24px;
          height: 24px;
        }

        .insight-header h3 {
          font-size: 1.2rem;
          font-weight: 700;
        }

        .insight-text {
          line-height: 1.6;
          font-size: 0.95rem;
        }

        /* Bottom Navigation */
        .bottom-nav {
          background: white;
          padding: 0.8rem 1rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.5rem;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .nav-item.active {
          color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .nav-item span {
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Session Screen */
        .session-screen {
          width: 100vw;
          height: 100vh;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.5s ease-out;
        }

        .session-header {
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
        }

        .back-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .session-timer {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .camera-view {
          flex: 1;
          position: relative;
          background: #1a1a1a;
          overflow: hidden;
        }

        .camera-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #666;
          gap: 1rem;
        }

        .skeleton-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
        }

        .pose-points {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .point {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #667eea;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.8);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .point.head { top: 15%; left: 50%; transform: translateX(-50%); }
        .point.shoulder-left { top: 25%; left: 42%; }
        .point.shoulder-right { top: 25%; left: 58%; }
        .point.spine-top { top: 35%; left: 50%; transform: translateX(-50%); }
        .point.spine-mid { top: 45%; left: 50%; transform: translateX(-50%); }
        .point.spine-low { top: 55%; left: 50%; transform: translateX(-50%); }
        .point.hip-left { top: 60%; left: 45%; }
        .point.hip-right { top: 60%; left: 55%; }

        .alignment-guides {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .vertical-guide {
          position: absolute;
          left: 50%;
          top: 10%;
          bottom: 10%;
          width: 2px;
          background: linear-gradient(180deg, transparent, #667eea, transparent);
          transform: translateX(-50%);
          opacity: 0.5;
        }

        .session-feedback {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          color: white;
        }

        .current-exercise {
          text-align: center;
          margin-bottom: 1rem;
        }

        .current-exercise h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .current-exercise p {
          font-size: 1rem;
          color: #94a3b8;
        }

        .posture-feedback {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .posture-feedback.good {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .exercise-progress {
          display: flex;
          justify-content: center;
        }

        .progress-circle {
          width: 120px;
          height: 120px;
          position: relative;
        }

        .progress-circle svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .progress-bg {
          fill: none;
          stroke: #2a2a2a;
          stroke-width: 8;
        }

        .progress-bar {
          fill: none;
          stroke: url(#progressGradient);
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 283;
          transition: stroke-dashoffset 0.5s ease;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .progress-text .reps {
          display: block;
          font-size: 2rem;
          font-weight: 900;
          color: white;
        }

        .progress-text .label {
          display: block;
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .session-controls {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .control-button {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 30px rgba(102, 126, 234, 0.5);
        }

        .control-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 40px rgba(102, 126, 234, 0.6);
        }

        .control-button:active {
          transform: scale(0.95);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 3px;
        }
      `}</style>

      {currentScreen === 'splash' && <SplashScreen />}
      {currentScreen === 'welcome' && <WelcomeScreen />}
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'dashboard' && <Dashboard />}
      {currentScreen === 'session' && <SessionScreen />}

      {/* SVG Gradients */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default SpineCoachApp;