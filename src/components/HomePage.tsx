import { useState } from "react";




const HomePage = () => {

    const [isSidebarCollapse,setIsSidebarCollapse] = useState<boolean>(false);


    return (
        <>
            {/* 左侧边栏， 貌似没什么必要左折叠hhh */}
            <HomePageSideBar isSidebarCollapse={isSidebarCollapse}/>
        
            {/* 右侧核心选择。。。。 */}
            <h2>Anki 制卡助手</h2>
            
        
        </>
    )
}



export default HomePage;