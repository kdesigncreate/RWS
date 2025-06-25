import type { Metadata } from 'next';
import HomePage from './HomePage';
import { generateMetadata as generateSEOMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateSEOMetadata({
  title: 'R.W.Sドリブル塾 - 全国のサッカードリブルスクール',
  description: 'R.W.Sドリブル塾は全国21都道府県でサッカーのドリブル技術向上を目的としたスクールを開催。独自の練習メニューで2000名以上の生徒が在籍し、Jリーグ下部組織合格者も輩出しています。',
  keywords: ['サッカー', 'ドリブル', 'スクール', 'RWS', 'サッカー教室', 'ドリブル塾', '全国', '技術向上', 'Jリーグ'],
  type: 'website',
});

export default function Page() {
  return <HomePage />;
}
import { MapPin, Users, Clock, Star, ExternalLink, Phone, Mail, Calendar, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostCardList } from '@/components/posts/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

export default function SoccerSchoolPage() {
  const { posts, loading, error, fetchPublicPosts } = usePosts();

  // コンポーネントマウント時に記事一覧を取得
  useEffect(() => {
    fetchPublicPosts({ limit: 5 }); // 最新5件を取得
  }, [fetchPublicPosts]);

  const staffMembers = [
    {
      name: '森陰　修平',
      position: '代表',
      image: '/images/IMG_0332.jpeg',
      schedule: [
        '毎週月曜日…西大宮校メインコーチ',
        '毎週火曜日…美園校メインコーチ',
        '毎週水曜日…戸田校メインコーチ',
        '毎週木曜日…江戸川メインコーチ',
        '毎週金曜日…鶴ヶ島校メインコーチ',
      ]
    },
    {
      name: '森陰　修平',
      position: '代表',
      image: '/images/IMG_0333.jpeg',
      schedule: [
        '毎週月曜日…西大宮校メインコーチ',
        '毎週火曜日…美園校メインコーチ',
        '毎週水曜日…戸田校メインコーチ',
        '毎週木曜日…江戸川メインコーチ',
        '毎週金曜日…鶴ヶ島校メインコーチ',
      ]
    },
    {
      name: '森陰　修平',
      position: '代表',
      image: '/images/IMG_0333.jpeg',
      schedule: [
        '毎週月曜日…西大宮校メインコーチ',
        '毎週火曜日…美園校メインコーチ',
        '毎週水曜日…戸田校メインコーチ',
        '毎週木曜日…江戸川メインコーチ',
        '毎週金曜日…鶴ヶ島校メインコーチ',
      ]
    },
  ];

  const schoolList = [
    '埼玉・東京スクール',
    '千葉・茨城スクール',
    '神奈川・愛知スクール',
    '大阪・兵庫スクール',
    '京都・滋賀スクール',
    '福岡・佐賀スクール',
    '新潟・静岡スクール',
    '栃木・岐阜スクール',
    '宮城・愛媛スクール',
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ヘッダー */}
      <Header />

      {/* メインビジュアル */}
      <section className="relative pt-16 sm:pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden">
            <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] relative">
              <img 
                src="/images/TOP.jpeg" 
                alt="R.W.S ドリブル塾" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
                    ドリブルの技術
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl opacity-90 mb-4 sm:mb-6 lg:mb-8 font-medium">
                    一歩先へ進む、確かな技術
                  </p>
                  <p className="text-sm sm:text-base md:text-lg opacity-80 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                    R.W.S独自の練習メニューで、あなたのドリブル技術を向上させます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* Posts セクション */}
        <section id="posts" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">News</h2>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl">最新の投稿</p>
            </div>
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="py-12">
                  <ErrorDisplay 
                    message={error} 
                    onRetry={() => fetchPublicPosts({ limit: 5 })}
                  />
                </div>
              ) : (
                <PostCardList 
                  posts={posts}
                  variant="compact"
                  showAuthor={true}
                  showStatus={false}
                  showReadingTime={false}
                  emptyMessage="まだ投稿がありません"
                />
              )}
              <div className="text-center mt-8 sm:mt-12">
                <Button className="bg-black text-white hover:bg-gray-800 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                  News一覧
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* About セクション */}
        <section id="about" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">About</h2>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl">R.W.Sドリブル塾について</p>
            </div>
            <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12">
              <Card className="p-6 sm:p-8 lg:p-12 bg-white shadow-xl">
                <CardContent>
                  <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-12">
                    <div className="flex-1">
                      <img 
                        src="/images/about.jpeg" 
                        alt="R.W.S ドリブル塾について" 
                        className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium">
                        『練習する事.チャレンジするだけでは意味がない.練習し続ける事.チャレンジし続ける事』に意味がある。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
              <Card>
                <CardHeader className="text-center pb-4 sm:pb-6">
                  <div className="mx-auto mb-4 sm:mb-6 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">全国でスクールを開催</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-gray-700 leading-relaxed text-center text-sm sm:text-base">
                    設立から6年で埼玉・東京・千葉・茨城・新潟・大阪・兵庫・神奈川・愛知・岐阜・鹿児島・静岡・栃木・京都・滋賀・三重・奈良・福岡・佐賀・宮城・愛媛にて設立から6年で2,000名のスクール生が在籍※受講者数は6年で20,000名以上。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="text-center pb-4 sm:pb-6">
                  <div className="mx-auto mb-4 sm:mb-6 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">R.W.S独自の練習メニュー</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-gray-700 leading-relaxed text-center text-sm sm:text-base">
                    【独自】の練習メニュー（特殊なボールを使ったトレーニングR・W・Sオリジナルコーンドリブルなど）で入会当初は最初全く出来なかったお子様がJリーグ下部組織.海外のクラブチームに合格者を輩出。人間生の部分でも、普段学校では自ら発言をしないお子様が発言をするようになったりと学校生活でも変化が…
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Staff セクション */}
        <section id="staff" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">Staff</h2>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl">指導スタッフ</p>
            </div>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto mb-8 sm:mb-12">
              {staffMembers.map((staff, index) => (
                <Card key={index}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 ring-4 ring-blue-100">
                        <AvatarImage src={staff.image} alt={staff.name} />
                        <AvatarFallback className="text-lg sm:text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">{staff.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2">{staff.name}</h4>
                      <Badge variant="outline" className="mb-4 text-xs sm:text-sm">{staff.position}</Badge>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <p className="font-medium text-gray-800 text-center text-sm sm:text-base">□担当校</p>
                      {staff.schedule.map((item, idx) => (
                        <div key={idx} className="flex items-start text-xs sm:text-sm text-gray-700 leading-relaxed">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-2 sm:mr-3 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="flex-1">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Button className="bg-black text-white hover:bg-gray-800 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                Staff一覧
              </Button>
            </div>
          </div>
        </section>

        {/* Price セクション */}
        <section id="price" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">Price</h2>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl">料金体系</p>
            </div>
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
              {/* 入会金 */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gray-800 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    入会金
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm sm:text-base">入会金</span>
                      <span className="text-right font-semibold text-sm sm:text-base">10,000円（税別）</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm sm:text-base flex items-center">
                        年会費
                        <Badge variant="secondary" className="ml-2 text-xs">※1</Badge>
                      </span>
                      <span className="text-right font-semibold text-sm sm:text-base">10,000円（税別）</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm sm:text-base flex items-center">
                        スポーツ保険
                        <Badge variant="secondary" className="ml-2 text-xs">※2</Badge>
                      </span>
                      <span className="text-right font-semibold text-sm sm:text-base">10,000円（税別）</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 教材費 */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gray-800 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Award className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    教材費
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <span className="font-medium text-sm sm:text-base flex items-center">
                      指定ウェア
                      <Badge variant="secondary" className="ml-2 text-xs">※3</Badge>
                    </span>
                    <span className="text-right font-semibold text-sm sm:text-base">10,000円（税別）</span>
                  </div>
                </CardContent>
              </Card>

              {/* 月会費 */}
              <Card className="shadow-xl">
                <CardHeader className="bg-gray-800 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    月会費
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm sm:text-base flex items-center">
                        90分スクール
                        <Badge variant="secondary" className="ml-2 text-xs">※4</Badge>
                      </span>
                      <span className="text-right font-semibold text-sm sm:text-base">10,000円（税別）</span>
                    </div>
                    <div className="flex justify-between items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm sm:text-base flex items-center">
                        120分スクール
                        <Badge variant="secondary" className="ml-2 text-xs">※4</Badge>
                      </span>
                      <span className="text-right font-semibold text-sm sm:text-base">10,000円（税別）</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                    <p><Badge variant="outline" className="mr-2">※1</Badge>入会月からの年度更新となります</p>
                    <p><Badge variant="outline" className="mr-2">※2</Badge>毎年の4月で年度更新となります</p>
                    <p><Badge variant="outline" className="mr-2">※3</Badge>シャツのみの値段です。シャツのみは入会して頂く際に購入して頂く形となります</p>
                    <p><Badge variant="outline" className="mr-2">※4</Badge>ご兄弟様は2人目から兄弟割引で上記の料金から3,000円引き</p>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-6 sm:mb-8">その他各スクールも開催しております</h3>
                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { name: 'ドリブル家庭教師', icon: Users },
                    { name: 'ドリブル少人数特別レッスン', icon: Star },
                    { name: '１dayスクール', icon: Calendar }
                  ].map((school, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <school.icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                        <h4 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">{school.name}</h4>
                        <Button className="w-full bg-black text-white hover:bg-gray-800 text-sm sm:text-base">
                          詳しく見る
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* School List セクション */}
        <section id="schoolList" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">School List</h2>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl">スクール一覧</p>
            </div>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {schoolList.map((school, index) => (
                <Card key={index} className="cursor-pointer">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600" />
                    </div>
                    <a href="#" className="block">
                      <h4 className="text-base sm:text-lg lg:text-xl font-semibold hover:text-blue-600 transition-colors">
                        {school}
                      </h4>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Videos セクション */}
        <section id="videos" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">

            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-xl">
                <CardContent className="p-6 sm:p-8 text-center">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 flex items-center justify-center">
                    全コーチの練習メニュー特典動画️【無料】プレゼント
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    この度、皆様に日頃の感謝の気持ちを込めて、<br className="hidden sm:block"/>
                    小学生、中学生にゼッタイにやってほしい練習メニューを<br className="hidden sm:block"/>
                    14個撮影しました<br/>
                    なんとそれを…<br/>
                    無料で皆様にプレゼントさせて頂きます！
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-xl">
                <CardContent className="p-6 sm:p-8 text-center">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 flex items-center justify-center">
                    無料動画14個の応募方法
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    お客様のお住まいの地域のRWSドリブル塾の公式LINEを追加して頂き<br className="hidden sm:block"/>
                    『全コーチのプレゼント動画』とメッセージを送るだけです
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center text-lg sm:text-xl">
                    <MapPin className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    地域ごとの公式LINEはコチラ↓↓
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { region: '関西支部', id: '@769fhryq' },
                      { region: '北陸支部', id: '@648cqorv' },
                      { region: '東海支部', id: '@285usnjz' },
                      { region: '九州支部', id: '@011nqumx' },
                      { region: '関東支部', id: '@efl1726g' },
                      { region: '東北支部', id: '@993qnrlr' },
                      { region: '四国支部', id: '@463iztgr' },
                    ].map((line, index) => (
                      <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="font-medium text-sm sm:text-base">{line.region}</span>
                        <Badge variant="outline" className="font-mono text-xs sm:text-sm">{line.id}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-xl">
                <CardContent className="p-6 sm:p-8 text-center">
                  <p className="text-gray-700 text-base sm:text-lg">
                    RWSドリブル塾のYouTubeをチャンネル登録も<br className="hidden sm:block"/>
                    忘れずにお願い致します！
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <Footer />
    </div>
  );
}