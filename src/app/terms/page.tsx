export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white py-20 px-6">
            <div className="max-w-3xl mx-auto prose prose-blue">
                <h1 className="text-3xl font-bold mb-8">서비스 이용약관</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">제 1 조 (목적)</h2>
                    <p>본 약관은 아이엠인터네셔널(이하 "회사")이 제공하는 SimpleSite 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">제 2 조 (용어의 정의)</h2>
                    <p>1. "서비스"란 회사가 제공하는 웹사이트 제작 및 호스팅 플랫폼을 의미합니다.</p>
                    <p>2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원을 말합니다.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">제 3 조 (유료 서비스 및 환불)</h2>
                    <p>1. 회원은 회사가 제공하는 유료 서비스를 결제하여 이용할 수 있습니다.</p>
                    <p>2. 유료 서비스의 환불 규정은 다음과 같습니다:</p>
                    <ul className="list-disc pl-6 my-4 bg-gray-50 p-4 rounded-lg">
                        <li><strong>결제일로부터 13일 이내:</strong> 100% 무상 환불이 가능합니다.</li>
                        <li><strong>결제일로부터 13일 이후:</strong> 환불이 불가능합니다.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">제 4 조 (서비스 이용의 제한)</h2>
                    <p>회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다.</p>
                    <ul className="list-disc pl-6">
                        <li>법령을 위반하거나 공서양속에 반하는 내용을 게시하는 경우</li>
                        <li>타인의 저작권 등 지적재산권을 침해하는 경우</li>
                        <li>서비스의 안정적인 운영을 방해하는 행위를 하는 경우</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">제 5 조 (문의처)</h2>
                    <p>서비스 이용과 관련된 문의는 아래 연락처로 접수해 주시기 바랍니다.</p>
                    <p className="mt-2 text-gray-600">
                        고객센터: 010-2216-9054<br />
                        이메일: inmyeong320@naver.com
                    </p>
                </section>

                <div className="mt-12 text-sm text-gray-500 border-t pt-8">
                    <p>공고일자: 2026년 2월 2일</p>
                    <p>시행일자: 2026년 2월 2일</p>
                </div>
            </div>
        </div>
    );
}
