import Link from 'next/link';
import { Check, Star, Zap, Shield, Layout, Smartphone } from 'lucide-react';

export const dynamic = 'force-static';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">SimpleSite</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">Beta</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-black transition">기능 소개</a>
            <a href="#pricing" className="hover:text-black transition">가격 정책</a>
            <a href="#faq" className="hover:text-black transition">자주 묻는 질문</a>
          </nav>
          <Link href="/login" className="text-sm font-bold bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition">
            5시간 무료 체험
          </Link>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero */}
        <section className="px-6 py-20 md:py-32 text-center max-w-5xl mx-auto">
          <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-6">🎁 5시간 무료 체험</div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            단 30초 만에 만드는 <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">나만의 웹사이트</span>
          </h1>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            디자인 몰라도 괜찮습니다. 빈칸만 채우면, 비즈니스를 위한 완벽한 반응형 홈페이지가 자동으로 완성됩니다.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-200 transition transform hover:scale-105">
              5시간 무료 체험 시작하기
            </Link>
            <span className="text-sm text-gray-400 font-medium">결제 정보 없이 바로 시작!</span>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">비즈니스에 필요한 모든 것</h2>
              <p className="text-gray-500">성공적인 비즈니스를 위한 강력한 기능들을 제공합니다.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Smartphone, title: "모바일 최적화", desc: "PC, 태블릿, 모바일 어디서나 완벽하게 보입니다." },
                { icon: Layout, title: "감각적인 디자인", desc: "신뢰를 주는 깔끔하고 프로페셔널한 디자인." },
                { icon: Zap, title: "즉시 퍼블리싱", desc: "결제 즉시 나만의 도메인으로 사이트가 오픈됩니다." },
                { icon: Star, title: "고객 후기 관리", desc: "고객들의 생생한 후기를 모아 신뢰도를 높이세요." },
                { icon: Shield, title: "안전한 호스팅", desc: "서버 관리, 보안 걱정 없이 운영에만 집중하세요." },
                { icon: Check, title: "SEO 검색 최적화", desc: "네이버, 구글 검색에 잘 노출되도록 최적화됩니다." }
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <f.icon className="text-blue-600 mb-4" size={32} />
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-24">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">투명한 요금제</h2>
            <p className="text-gray-500 mb-12">5시간 무료 체험 후, 원하는 플랜을 선택하세요.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Plan */}
              <div className="bg-white border-2 border-gray-200 p-10 rounded-3xl shadow-lg">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">기본 플랜</h3>
                <div className="text-5xl font-bold mb-2 text-gray-900">9,900원<span className="text-xl text-gray-400 font-normal">/년</span></div>
                <p className="text-gray-400 mb-8">한 달 1,000원도 안 되는 가격</p>

                <ul className="text-left space-y-4 mb-10 text-gray-600">
                  <li className="flex items-center gap-3"><Check className="text-green-500" /> 무제한 트래픽 제공</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500" /> 호스팅 비용 무료</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500" /> 모바일 자동 최적화</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500" /> 이메일 고객 지원</li>
                </ul>

                <Link href="/login" className="block w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition">
                  무료 체험 시작
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-black text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold px-4 py-1.5 rounded-bl-xl">✨ PRO</div>
                <h3 className="text-2xl font-bold mb-2">프로 플랜</h3>
                <div className="text-5xl font-bold mb-2">49,900원<span className="text-xl text-gray-400 font-normal">/년</span></div>
                <p className="text-gray-400 mb-8">비즈니스를 위한 프리미엄 기능</p>

                <ul className="text-left space-y-4 mb-10 text-gray-300">
                  <li className="flex items-center gap-3"><Check className="text-purple-400" /> 기본 플랜 모든 기능</li>
                  <li className="flex items-center gap-3"><Check className="text-purple-400" /> 고급 디자인 커스터마이징</li>
                  <li className="flex items-center gap-3"><Check className="text-purple-400" /> 우선 고객 지원</li>
                  <li className="flex items-center gap-3"><Check className="text-purple-400" /> 커스텀 도메인 연결 (추가결제)</li>
                </ul>

                <Link href="/login" className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition">
                  프로로 시작
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 py-12 text-center text-sm text-gray-400">
        &copy; 2026 SimpleSite. All rights reserved.
      </footer>
    </div>
  );
}
