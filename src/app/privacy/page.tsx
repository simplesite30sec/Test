export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white py-20 px-6">
            <div className="max-w-3xl mx-auto prose prose-blue">
                <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>

                <section className="mb-8">
                    <p>아이엠인터네셔널(이하 &quot;회사&quot;)은 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">1. 수집하는 개인정보의 항목</h2>
                    <p>회사는 서비스 제공을 위해 다음의 개인정보를 수집하고 있습니다.</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>필수항목: 이메일 주소, 소셜 로그인 정보(카카오, 구글)</li>
                        <li>선택항목: 휴대전화번호 (알림 서비스 이용 시)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">2. 개인정보의 수집 및 이용목적</h2>
                    <p>수집한 개인정보는 다음의 목적을 위해 활용합니다.</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>회원 가입 및 관리</li>
                        <li>서비스 제공 및 계약의 이행</li>
                        <li>고객 문의 응대 및 공지사항 전달</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">3. 개인정보의 보유 및 이용기간</h2>
                    <p>이용자의 개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다. 단, 관련 법령에 의하여 보존할 필요가 있는 경우에는 해당 기간 동안 보관합니다.</p>
                    <ul className="list-disc pl-6 mt-2">
                        <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4">4. 개인정보 보호책임자</h2>
                    <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                        <p><strong>성명:</strong> 서인명</p>
                        <p><strong>직책:</strong> 대표</p>
                        <p><strong>연락처:</strong> 010-2216-9054 / inmyeong320@naver.com</p>
                    </div>
                </section>

                <div className="mt-12 text-sm text-gray-500 border-t pt-8">
                    <p>공고일자: 2026년 2월 2일</p>
                    <p>시행일자: 2026년 2월 2일</p>
                </div>
            </div>
        </div>
    );
}
