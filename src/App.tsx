import { useAppStore } from "./store/globalStore";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import CardProcessorPage from "./pages/CardProcessorPage";
import CardReviewPage from "./pages/CardReviewPage";
import Layout from "./components/Layout";

function App() {
    const { currentPage, isCardReviewMode } = useAppStore();

    // 如果在卡片确认模式，显示确认页面（不使用Layout）
    if (isCardReviewMode) {
        return <CardReviewPage />;
    }

    // 根据当前页面显示对应组件，并使用Layout组件包装
    let PageComponent;
    switch (currentPage) {
        case "home":
            PageComponent = HomePage;
            break;
        case "settings":
            PageComponent = SettingsPage;
            break;
        case "card-processor":
            return <CardProcessorPage />;
        default:
            PageComponent = HomePage;
            break;
    }

    return (
        <Layout>
            <PageComponent />
        </Layout>
    );
}

export default App;
