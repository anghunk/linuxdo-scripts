<template>
  <div class="linuxdoscripts-setting-wrap" v-show="!isShow" :style="`height:${controlheight}vh`">
    <button class="linuxdoscripts-setting" title="设置" type="button" @click="setting">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/></svg>
    </button>
  </div>
  <div id="linuxdoscripts">
    <div class="linuxdoscripts-opacity" v-show="opacity"></div>
    <div class="setting-btn" :class="{ active: isMenuOpen,'menu-items': settingData.checked54,}" id="menuItems">
      <BackToTop v-show="showbacktotop" /> <!-- 返回顶部按钮 -->
      <BackToOneFloor v-show="showbacktoonefloor" /> <!-- 直达一楼按钮 -->
      <ReplyBtn v-show="showreplybtn" /> <!-- 显示回复按钮 -->
      <LookOP v-show="showlookop" /> <!-- 只看楼主 -->
      <LevelDialog v-show="showlevelsearch" /> <!-- 查询等级功能 -->
      <BookmarkBtn v-show="showbookmarkbtn" /> <!-- 右下角收藏按钮 -->
      <BookmarkFolderBtn v-show="showbookmarkfolderbtn" /> <!-- 右下角收藏按钮 -->
      <ViewHistoryList v-show="showviewhistorylist" /> <!-- 快速查看浏览历史已读列表 -->
    </div>

    <div class="main-btn" v-if="settingData.checked54" :class="{active:isMenuOpen}" id="mainBtn" @click="toggleMenu()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid-icon lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
    </div>

    <dialog open id="menu_suspendedball" v-show="showdialog">
      <div class="menu-header">
        <div class="title">LinuxDo Scripts 扩展设置</div>
        <div class="close" @click="closedialog">+</div>
      </div>
      <div class="menu-flex">
        <ul class="menu-nav">
          <li @click="showItem(0)" :class="{ act: activeIndex == 0 }">
            <Setting1 />通用设置
          </li>
          <li @click="showItem(1)" :class="{ act: activeIndex == 1 }">
            <Setting2 />自定义
          </li>
          <li @click="showItem(2)" :class="{ act: activeIndex == 2 }">
            <Setting3 />用户标签
          </li>
          <li @click="showItem(3)" :class="{ act: activeIndex == 3 }">
            <Setting4 />AI 配置
          </li>
          <li @click="showItem(4)" :class="{ act: activeIndex == 4 }">
            <Setting5 />主题风格
          </li>
          <li @click="showItem(5)" :class="{ act: activeIndex == 5 }">
            <Setting6 />数据备份
          </li>
          <Updates />
        </ul>
        <div class="menu-body">
          <div class="menu-body-item" v-show="activeIndex == 0">
            <div v-if="!dataLoaded" style="text-align: center; padding: 20px;">
              <p>正在加载设置数据...</p>
            </div>
            <div v-if="dataLoaded">
              <div class="menu-about">
                <p>请注意，该设置面板数据全部保存在本地浏览器缓存中，注意备份。</p>

                <!-- 添加设置搜索框 -->
                <div class="settings-search" style="margin: 10px 0">
                  <input
                    type="text"
                    v-model="settingsSearchQuery"
                    @keydown="handleKeyDown"
                    placeholder="搜索设置项..."
                    style="
                      padding: 6px 10px;
                      border-radius: 4px;
                      width: 80%;
                      font-size: 13px;
                    "
                  />
                </div>

                <p class="hint">
                  如果感觉哪里不太对劲，点我
                  <span class="initialization" @click="initialization">初始化设置</span>
                  ，会清除所有的设置数据并初始化！！
                </p>
              </div>

              <div class="group-line">外观设置</div>
              <!-- 简洁模式 -->
              <MenuSimpleMode :sort="1" v-model="settingData.checked0" v-show="matchesSearch('简洁模式')"/>
              <!-- 浏览器边缘触发设置按钮的范围 -->
              <MenuControlHeight :sort="1.0" v-model="settingData.checked01" v-show="matchesSearch('按钮区域触发高度')"/>
              <!-- 智能限制楼层高度 -->
              <MenuFloorHeight :sort="2" v-model="settingData.checked10" v-show="matchesSearch('智能限制楼层高度')"/>
              <!-- 中英文混排优化显示 -->
              <MenuPangu :sort="3" v-model="settingData.checked11" v-show="matchesSearch('中英文混排优化显示')"/>
              <!-- 隐藏话题详情顶部大标题 -->
              <MenuHidetopicdetailtitle :sort="4" v-model="settingData.checked6" v-show="matchesSearch('隐藏话题详情顶部大标题')"/>
              <!-- 只看自己签名 -->
              <MenuLookmeSign :sort="5" v-model="settingData.checked15" v-show="matchesSearch('只看自己签名')"/>
              <!-- 切换论坛表情风格 -->
              <MenureplaceEmojiStyle :sort="6" v-model="settingData.checked17" v-show="matchesSearch('切换论坛表情风格')"/>
              <!-- 开启列表页导航栏浮动 -->
              <MenuStickyNav :sort="7" v-model="settingData.checked20" v-show="matchesSearch('列表页导航栏浮动')"/>
              <!-- 自动切换黑夜模式 -->
              <MenuAutoDark :sort="8" v-model="settingData.checked27" v-show="matchesSearch('自动切换黑夜模式')"/>
              <!-- 是否移除话题上的头像 (减少网络请求) -->
              <MenuRemovePostAvatar :sort="9" v-model="settingData.removePostavatarData" v-show="matchesSearch('移除话题上的头像')"/>
              <!-- 隐藏新消息小蓝点（除帖子未读小蓝点） -->
              <MenuHideNewBluedot :sort="10" v-model="settingData.checked37" v-show="matchesSearch('隐藏新消息小蓝点')"/>
              <!-- gif 头像转静态图片 -->
              <MenuGifToPng :sort="11" v-model="settingData.checked38" v-show="matchesSearch('gif 头像转静态图片')"/>
              <!-- 是否美化过长的昵称 -->
              <MenuUsernameLength :sort="12" v-model="settingData.checked45" v-show="matchesSearch('美化过长的昵称')"/>
              <!-- 是否开启超长显示器宽度优化 -->
              <MenuMonitorWidthOptimization :sort="13" v-model="settingData.checked46" v-show="matchesSearch('超长显示器宽度优化')"/>
              <!-- 类别页优化 banner 显示 -->
              <MenuCatePageOptimizeBanner :sort="14" v-model="settingData.checked47" v-show="matchesSearch('类别页优化 banner 显示')"/>
              <!-- 是否自动隐藏"福利羊毛"中已领完的帖子 -->
              <MenuHideWelfareDone :sort="15" v-model="settingData.checked42" v-show="matchesSearch('隐藏福利羊毛中已领完的帖子')"/>
              <!-- 是否自动加载新话题 -->
              <MenuAutoLoadTopic :sort="16" v-model="settingData.checked55" v-show="matchesSearch('是否自动加载新话题')"/>

              <div class="group-line">功能点设置</div>
              <!-- 新标签页打开 -->
              <MenuOpenpostblank :sort="1" v-model="settingData.checked1" v-show="matchesSearch('新标签页打开')"/>
              <!-- 话题列表显示创建时间 -->
              <MenuShowcreatetime :sort="2" v-model="settingData.checked4" v-show="matchesSearch('话题列表显示创建时间')"/>
              <MenuShowcreatetime1 :sort="3" v-model="settingData.checked41" v-show="matchesSearch('话题列表显示创建时间')"/>
              <!-- 显示楼层数 -->
              <MenuShowfloors :sort="4" v-model="settingData.checked5" v-show="matchesSearch('显示楼层数')"/>
              <!-- 新话题提醒 -->
              <MenuNewtopicreminder :sort="5" v-model="settingData.checked2" v-show="matchesSearch('新话题提醒')"/>
              <!-- 自动展开回复 -->
              <MenuAutoexpandreply :sort="6" v-model="settingData.checked3" v-show="matchesSearch('自动展开回复')"/>
              <!-- 禁用视频自动播放 -->
              <MenuDisableAutoplay :sort="7" v-model="settingData.checked24" v-show="matchesSearch('禁用视频自动播放')"/>
              <!-- 是否显示快捷点赞主题按钮 -->
              <MenuQuickLikeTopic :sort="8" v-model="settingData.checked35" v-show="matchesSearch('快捷点赞主题按钮')"/>
              <!-- 楼主头衔显示 -->
              <MenuTopicOwnerBadge :sort="9" v-model="settingData.checked49" v-show="matchesSearch('楼主头衔显示')"/>
              <!-- 话题始终打开 1 楼 -->
              <MenuAlwaysFirstPost :sort="10" v-model="settingData.checked50" v-show="matchesSearch('话题始终打开1楼')"/>
              <!-- 消息通知仅显示未读 -->
              <MenuShowUnread :sort="11" v-model="settingData.checked13" v-show="matchesSearch('消息通知仅显示未读')"/>
              <!-- 是否屏蔽模糊文字 -->
              <MenuFilterText :sort="12" v-model="settingData.checked14" v-show="matchesSearch('屏蔽模糊文字')"/>
              <!-- 禁用选中文字分享功能 -->
              <MenuSelectedShare :sort="13" v-model="settingData.checked23" v-show="matchesSearch('禁用选中文字分享功能')"/>
              <!-- 查看话题内自己回复的楼层数（抽奖贴适用） -->
              <MenuViewOwnReply :sort="14" v-model="settingData.checked44" v-show="matchesSearch('查看话题内自己回复的楼层数')"/>
              <!-- 是否自动打开外链（请谨慎操作，避免打开恶意链接） -->
              <MenuAutoOpenLink :sort="15" v-model="settingData.checked58" v-show="matchesSearch('自动打开外链')"/>

              <div class="group-line">编辑器设置</div>
              <!-- 编辑器切换 ja 字体 -->
              <MenuEditorJa :sort="1" v-model="settingData.checked19" v-show="matchesSearch('编辑器切换 ja 字体')"/>
              <!-- 是否隐藏输入框提示文字 -->
              <MenuHiddenPlaceholder :sort="2" v-model="settingData.checked28" v-show="matchesSearch('隐藏输入框提示文字')"/>
              <!-- 是否显示 Neo 表情包 -->
              <MenuShowNeoEmoji :sort="3" v-model="settingData.checked51" v-show="matchesSearch('Neo表情包')"/>
              <!-- 是否显示 Obsidian Callouts -->
              <MenuObsidianCallouts :sort="4" v-model="settingData.checked57" v-show="matchesSearch('Obsidian Callouts')"/>

              <div class="group-line">外置按钮</div>
              <!-- 启用新 UI：收缩右下角按钮  -->
              <MenuUIContractionBtn :sort="0" v-model="settingData.checked54" v-show="matchesSearch('启用新 UI：收缩右下角按钮')"/>
              <!-- 列表快速免打扰帖子 -->
              <MenuDonotTopic :sort="1" v-model="settingData.checked26" v-show="matchesSearch('列表快速免打扰帖子')"/>
              <!-- 话题预览功能 -->
              <MenuTopicpreview1 :sort="2" v-model="settingData.checked7" v-show="matchesSearch('话题预览功能')"/>
              <MenuTopicpreview2 :sort="2.1" v-model="settingData.checked7_1" v-show="matchesSearch('话题预览功能')"/>
              <MenuTopicpreview3 :sort="2.2" v-model="settingData.checked7_2" v-show="matchesSearch('话题预览功能')"/>
              <!-- 回复悬浮按钮 -->
              <MenuShowRepltBtn :sort="3" v-model="settingData.checked25" v-show="matchesSearch('回复悬浮按钮')"/>
              <!-- 只看楼主按钮 -->
              <MenuLookOP :sort="4" v-model="settingData.checked9" v-show="matchesSearch('只看楼主按钮')"/>
              <!-- 是否显示等级查询按钮 -->
              <MenuLevelSearch :sort="5" v-model="settingData.checked12" v-show="matchesSearch('等级查询按钮')"/>
              <!-- 是否显示返回顶部按钮 -->
              <MenuBackToTop :sort="6" v-model="settingData.checked34" v-show="matchesSearch('返回顶部按钮')"/>
              <!-- 添加直达一楼按钮 -->
              <MenuBackToOneFloor :sort="6.1" v-model="settingData.checked48" v-show="matchesSearch('直达一楼按钮')"/>
              <!-- 是否开启话题转为图片进行分享 -->
              <MenuTopicToImages :sort="7" v-model="settingData.checked43" v-show="matchesSearch('话题转为图片进行分享')"/>
              <!-- 是否开启论坛文章导出功能 -->
              <MenuExportArticle :sort="8" v-model="settingData.checkedExportArticle" v-show="matchesSearch('论坛文章导出')"/>
              <!-- 快速查看浏览历史已读列表（右下角弹窗） -->
              <MenuViewHistoryRead :sort="9" v-model="settingData.checked56" v-show="matchesSearch('查看历史已读列表')"/>

              <div class="group-line">收藏功能</div>
              <!-- 是否开启收藏功能 -->
              <MenuBookmark :sort="1" v-model="settingData.checked40" v-show="matchesSearch('收藏功能')"/>
              <!-- 是否在右下角显示收藏按钮 -->
              <MenuBookmarkBtn :sort="2" v-model="settingData.checked52" v-show="matchesSearch('右下角显示收藏按钮')"/>
              <!-- 是否显示跳转到文件夹按钮 -->
              <MenuBookmarkFolderBtn :sort="3" v-model="settingData.checked53" v-show="matchesSearch('右下角显示收藏按钮')"/>
            </div>
          </div>
          <div class="menu-body-item" v-show="activeIndex == 1">
            <!-- 自定义论坛 logo -->
            <MenuLogoUrl :sort="1" v-model:value="settingData.logourl" />
            <!-- 自定义论坛标签页 icon 和 title -->
            <MenuIconTitle :sort="2" v-model:value="settingData.IconTitle" />
            <!-- 自定义快捷回复 -->
            <MenuCreatereply :sort="3" v-model:value="settingData.QuickReply" />
            <MenuCreatereplyisDropdown v-model="settingData.QuickReplyisDropdown" />
            <!-- 关键词屏蔽功能 -->
            <MenuBlockKeyword :sort="4" v-model:value="settingData.blockkeywrod" />
            <!-- 标签屏蔽功能 -->
            <MenuBlockTags :sort="5" v-model:value="settingData.blocktags" />
            <!-- 屏蔽用户功能 -->
            <MenuBlockuserlist :sort="6" v-model:value="settingData.blockList" />
            <!-- 屏蔽指定分类的多少天前的帖子 -->
            <MenuShieldPosts :sort="7" v-model:value="settingData.checked21" />
            <!-- 自定义 CSS -->
            <MenuOtherCss :sort="8" v-model:value="settingData.othercss" />
          </div>
          <div class="menu-body-item" v-show="activeIndex == 2">
            <!-- 是否开启用户标签 -->
            <MenuUserTags v-model="settingData.isUserTags" />
            <UserTags v-model:value="settingData.usertags" />
          </div>
          <div class="menu-body-item" v-show="activeIndex == 3">
            <GPTconfig v-model:value="settingData.gptdata" />
          </div>
          <div class="menu-body-item" v-show="activeIndex == 4">
            <Themes v-model="settingData.themes" />
          </div>
          <div class="menu-body-item" v-show="activeIndex == 5">
            <SyncBackup />
          </div>
        </div>
      </div>
      <div class="menu-footer">
        <button class="save" @click="save">保存</button>
        <button class="saveload" @click="saveload">保存并刷新</button>
      </div>
    </dialog>

    <!-- 使用提示 -->
    <UsageTip />
    <!-- 回复弹窗显示贴吧表情 -->
    <ReplyTBEnjoy />
    <!-- 修复小尾巴裂图 -->
    <Signature />
  </div>
  <div id="messageToast"></div>
</template>

<script>
import $ from "jquery";
import settingsManager from "./utilities/settingsManager.js";

// 基础设置
import packageJson from "../package.json";

import MenuSimpleMode from "./SettingComponents/BasicSettings/MenuSimpleMode.vue";
import MenuControlHeight from "./SettingComponents/BasicSettings/MenuControlHeight.vue";
import MenuOpenpostblank from "./SettingComponents/BasicSettings/MenuOpenpostblank.vue";
import MenuNewtopicreminder from "./SettingComponents/BasicSettings/MenuNewtopicreminder.vue";
import MenuAutoexpandreply from "./SettingComponents/BasicSettings/MenuAutoexpandreply.vue";
import MenuAutoexpandreply1 from "./SettingComponents/BasicSettings/MenuAutoexpandreply1.vue";
import MenuShowcreatetime from "./SettingComponents/BasicSettings/MenuShowcreatetime.vue";
import MenuShowcreatetime1 from "./SettingComponents/BasicSettings/MenuShowcreatetime1.vue";
import MenuShowfloors from "./SettingComponents/BasicSettings/MenuShowfloors.vue";
import MenuHidetopicdetailtitle from "./SettingComponents/BasicSettings/MenuHidetopicdetailtitle.vue";
import MenuTopicpreview1 from "./SettingComponents/BasicSettings/MenuTopicpreview1.vue";
import MenuTopicpreview2 from "./SettingComponents/BasicSettings/MenuTopicpreview2.vue";
import MenuTopicpreview3 from "./SettingComponents/BasicSettings/MenuTopicpreview3.vue";
import MenuLookOP from "./SettingComponents/BasicSettings/MenuLookOP.vue";
import MenuFloorHeight from "./SettingComponents/BasicSettings/MenuFloorHeight.vue";
import ReplyTBEnjoy from "./SettingComponents/BasicSettings/ReplyTBEnjoy.vue";
import MenuPangu from "./SettingComponents/BasicSettings/MenuPangu.vue";
import MenuLevelSearch from "./SettingComponents/BasicSettings/MenuLevelSearch.vue";
import MenuShowUnread from "./SettingComponents/BasicSettings/MenuShowUnread.vue";
import MenuFilterText from "./SettingComponents/BasicSettings/MenuFilterText.vue";
import MenuLookmeSign from "./SettingComponents/BasicSettings/MenuLookmeSign.vue";
import MenureplaceEmojiStyle from "./SettingComponents/BasicSettings/MenureplaceEmojiStyle.vue";
import MenuEditorJa from "./SettingComponents/BasicSettings/MenuEditorJa.vue";
import MenuStickyNav from "./SettingComponents/BasicSettings/MenuStickyNav.vue";
import MenuSelectedShare from "./SettingComponents/BasicSettings/MenuSelectedShare.vue";
import MenuDisableAutoplay from "./SettingComponents/BasicSettings/MenuDisableAutoplay.vue";
import MenuShowRepltBtn from "./SettingComponents/BasicSettings/MenuShowRepltBtn.vue";
import MenuDonotTopic from "./SettingComponents/BasicSettings/MenuDonotTopic.vue";
import MenuAutoDark from "./SettingComponents/BasicSettings/MenuAutoDark.vue";
import MenuHiddenPlaceholder from "./SettingComponents/BasicSettings/MenuHiddenPlaceholder.vue";
import MenuRemovePostAvatar from "./SettingComponents/BasicSettings/MenuRemovePostAvatar.vue";
import MenuBackToTop from "./SettingComponents/BasicSettings/MenuBackToTop.vue";
import MenuBackToOneFloor from "./SettingComponents/BasicSettings/MenuBackToOneFloor.vue";
import MenuQuickLikeTopic from "./SettingComponents/BasicSettings/MenuQuickLikeTopic.vue";
import MenuHideNewBluedot from "./SettingComponents/BasicSettings/MenuHideNewBluedot.vue";
import MenuGifToPng from "./SettingComponents/BasicSettings/MenuGifToPng.vue";
import MenuBookmark from "./SettingComponents/BasicSettings/MenuBookmark.vue";
import MenuHideWelfareDone from "./SettingComponents/BasicSettings/MenuHideWelfareDone.vue";
import MenuTopicToImages from "./SettingComponents/BasicSettings/MenuTopicToImages.vue";
import MenuViewOwnReply from "./SettingComponents/BasicSettings/MenuViewOwnReply.vue";
import MenuUsernameLength from "./SettingComponents/BasicSettings/MenuUsernameLength.vue";
import MenuMonitorWidthOptimization from "./SettingComponents/BasicSettings/MenuMonitorWidthOptimization.vue";
import MenuCatePageOptimizeBanner from "./SettingComponents/BasicSettings/MenuCatePageOptimizeBanner.vue";
import MenuExportArticle from "./SettingComponents/BasicSettings/MenuExportArticle.vue";
import MenuTopicOwnerBadge from "./SettingComponents/BasicSettings/MenuTopicOwnerBadge.vue";
import MenuAlwaysFirstPost from "./SettingComponents/BasicSettings/MenuAlwaysFirstPost.vue";
import MenuShowNeoEmoji from "./SettingComponents/BasicSettings/MenuShowNeoEmoji.vue";
import MenuBookmarkBtn from "./SettingComponents/BasicSettings/MenuBookmarkBtn.vue";
import MenuBookmarkFolderBtn from "./SettingComponents/BasicSettings/MenuBookmarkFolderBtn.vue";
import MenuAutoLoadTopic from "./SettingComponents/BasicSettings/MenuAutoLoadTopic.vue";
import MenuViewHistoryRead from "./SettingComponents/BasicSettings/MenuViewHistoryRead.vue";
import MenuObsidianCallouts from "./SettingComponents/BasicSettings/MenuObsidianCallouts.vue";
import MenuAutoOpenLink from "./SettingComponents/BasicSettings/MenuAutoOpenLink.vue";

// 自定义文字
import MenuOtherCss from "./SettingComponents/CustomText/MenuOtherCss.vue";
import MenuLogoUrl from "./SettingComponents/CustomText/MenuLogoUrl.vue";
import MenuIconTitle from "./SettingComponents/CustomText/MenuIconTitle.vue";
import MenuCreatereply from "./SettingComponents/CustomText/MenuCreatereply.vue";
import MenuCreatereplyisDropdown from "./SettingComponents/CustomText/MenuCreatereplyisDropdown.vue";
import MenuBlockuserlist from "./SettingComponents/CustomText/MenuBlockuserlist.vue";
import MenuBlockKeyword from "./SettingComponents/CustomText/MenuBlockKeyword.vue";
import MenuShieldPosts from "./SettingComponents/CustomText/MenuShieldPosts.vue";
import MenuBlockTags from "./SettingComponents/CustomText/MenuBlockTags.vue";

// 用户标签
import UserTags from "./SettingComponents/UserTags/UserTags.vue";
import MenuUserTags from "./SettingComponents/UserTags/MenuUserTags.vue";

// AI 配置
import GPTconfig from "./SettingComponents/AIConfig/GPTconfig.vue";

// 主题风格
import Themes from "./SettingComponents/Themes/index.vue";

// 数据同步备份
import SyncBackup from "./SettingComponents/Sync/SyncBackup.vue";

// 按钮
import MenuUIContractionBtn from "./SettingComponents/Button/MenuUIContractionBtn.vue";
import LookOP from "./SettingComponents/Button/LookOP.vue";
import LevelDialog from "./SettingComponents/Button/LevelDialog.vue";
import ReplyBtn from "./SettingComponents/Button/ReplyBtn.vue";
import BackToTop from "./SettingComponents/Button/BackToTop.vue";
import BackToOneFloor from "./SettingComponents/Button/BackToOneFloor.vue";
import BookmarkBtn from "./SettingComponents/Button/BookmarkBtn.vue";
import BookmarkFolderBtn from "./SettingComponents/Button/BookmarkFolderBtn.vue";
import ViewHistoryList from "./SettingComponents/Button/ViewHistoryList.vue";

// 其他组件
import Updates from "./SettingComponents/Other/Updates.vue";
import UsageTip from "./SettingComponents/Other/UsageTip.vue";
import Signature from "./SettingComponents/Other/Signature.vue";

// svg 图标
import Setting1 from "./SettingComponents/Svg/Setting1.vue";
import Setting2 from "./SettingComponents/Svg/Setting2.vue";
import Setting3 from "./SettingComponents/Svg/Setting3.vue";
import Setting4 from "./SettingComponents/Svg/Setting4.vue";
import Setting5 from "./SettingComponents/Svg/Setting5.vue";
import Setting6 from "./SettingComponents/Svg/Setting6.vue";
import Setting7 from "./SettingComponents/Svg/Setting7.vue";

export default {
  components: {
    Setting1,
    Setting2,
    Setting3,
    Setting4,
    Setting5,
    Setting6,
    Setting7,
    MenuSimpleMode,
    MenuControlHeight,
    MenuOpenpostblank,
    MenuNewtopicreminder,
    MenuAutoexpandreply,
    MenuAutoexpandreply1,
    MenuShowcreatetime,
    MenuShowcreatetime1,
    MenuShowfloors,
    MenuHidetopicdetailtitle,
    MenuTopicpreview1,
    MenuTopicpreview2,
    MenuTopicpreview3,
    MenuCreatereply,
    MenuCreatereplyisDropdown,
    MenuBlockuserlist,
    Updates,
    MenuLookOP,
    LookOP,
    LevelDialog,
    BookmarkBtn,
    BookmarkFolderBtn,
    UsageTip,
    MenuFloorHeight,
    UserTags,
    MenuOtherCss,
    MenuLogoUrl,
    ReplyTBEnjoy,
    MenuUIContractionBtn,
    MenuPangu,
    MenuLevelSearch,
    MenuShowUnread,
    MenuFilterText,
    MenuLookmeSign,
    MenureplaceEmojiStyle,
    MenuEditorJa,
    GPTconfig,
    MenuStickyNav,
    MenuBlockKeyword,
    SyncBackup,
    MenuShieldPosts,
    Themes,
    Signature,
    MenuSelectedShare,
    MenuDisableAutoplay,
    MenuShowRepltBtn,
    ReplyBtn,
    MenuDonotTopic,
    MenuAutoDark,
    MenuHiddenPlaceholder,
    MenuRemovePostAvatar,
    MenuBackToTop,
    MenuBackToOneFloor,
    BackToTop,
    BackToOneFloor,
    MenuQuickLikeTopic,
    MenuHideNewBluedot,
    MenuGifToPng,
    MenuBookmark,
    MenuHideWelfareDone,
    MenuTopicToImages,
    MenuViewOwnReply,
    MenuUsernameLength,
    MenuMonitorWidthOptimization,
    MenuIconTitle,
    MenuCatePageOptimizeBanner,
    MenuUserTags,
    MenuExportArticle,
    MenuTopicOwnerBadge,
    MenuAlwaysFirstPost,
    MenuBlockTags,
    MenuShowNeoEmoji,
    MenuBookmarkBtn,
    MenuBookmarkFolderBtn,
    MenuAutoLoadTopic,
    MenuViewHistoryRead,
    ViewHistoryList,
    MenuObsidianCallouts,
    MenuAutoOpenLink,
  },
  data() {
    return {
      isShow: false,
      controlheight: 100,

      opacity: false,
      showdialog: false,

      activeIndex: 0, // 当前激活的索引

      version: packageJson.version,
      opacity: false,
      open: false,

      // 设置数据
      settingData: {
        checked0: false,
        checked01: 100,
        checked1: false,
        checked2: false,
        checked3: false,
        checked31: false,
        checked4: false,
        checked41: true,
        checked5: true,
        checked6: false,
        checked7: false,
        checked7_1: false,
        checked7_2: false,
        checked9: true,
        QuickReply: "",
        QuickReplyisDropdown: false,
        blockList: "",
        blockkeywrod: "",
        blocktags: "",
        checked10: false,
        othercss: "",
        logourl: "",
        IconTitle: {
          iconurl: "",
          title: "",
        },
        checked11: true,
        checked12: true,
        checked13: false,
        checked14: false,
        checked15: false,
        checked17: {
          value1: true,
          value2: "twitter",
        },
        checked19: false,
        checked20: false,
        checked21: {
          value1: false,
          cate: "搞七捻三",
          days: "5",
        },
        checked23: false,
        checked24: true,
        checked25: true,
        checked26: true,
        checked27: false,
        checked28: false,
        checked34: true,
        checked35: false,
        checked37: false,
        checked38: false,
        checked40: false,
        checked42: false,
        checked43: false,
        checked44: false,
        checked45: false,
        checked46: false,
        checked47: false,
        checked48: false,
        checked49: false,
        checked50: false,
        checked51: false,
        checked52: false,
        checked53: false,
        checked54: false,
        checked55: false,
        checked56: false,
        checked57: false,
        checked58: false,
        removePostavatarData: {
          enable: false,
          showAuthor: false,
          showAuthorName: false,
        },
        isUserTags: true,
        usertags: [],
        gptdata: {
          value1: false,
          value2: false,
          title: false,
          summaryAll: false,
          btn: true,
          provider: "openai",
          apikey: "",
          api_url: "https://api.openai.com/v1/chat/completions",
          model: "gpt-4o-mini",
          isTemPer: true,
          temperature: 0.7,
          prompt:
            "根据以下帖子内容进行总结，请使用 markdown 格式返回回答，没有字数限制，但要求文字精炼，简介准确，语言要求返回简体中文，并且进行中英文混排优化。可以通过编号列表（1，2，3）列出核心要点。注意不要输出标题，例如：核心要点总结，帖子总结等，直接输出文本段落。",
          prompt1:
            "根据以下帖子内容，帮我给作者写一条回复，简短，表明我的观点，用口语回复，不需要很正式。您可以通过讨论的方式进行回复，这将有助于引导其他用户或作者进行互动。",
          prompt2:
            "根据以下帖子内容，生成一个合适的标题用于社交论坛发布使用，格式要求：不要书名号或其他符号，只需要一句纯文本。尽量精简到 15 字以内，如果字数不够表达主题，可以适当多生成几个字。",
          prompt3:
            '我会输入一论坛的主贴及所有回复，你需要输出：1.主贴总结：简要概括主贴核心内容 (2-3 句)，2. 讨论分析：主要观点倾向和共识/分歧点，讨论氛围评估 3.代表性回复：引用几条有代表性的回复 (附用户名)，简述每条回复的代表性和价值 4.争议点标记：标记格式：⚠️ [用户名]: "引用内容"，简析争议原因和各方立场 5.简要评估：评估讨论的整体氛围（如：友善、学术性、对抗性等）注意：保持客观公正，注重实质内容分析，区分事实与观点',
        },
        themes: 0,
        checkedExportArticle: false,
      },

      showlookop: false,
      showlevelsearch: false,
      showreplybtn: false,
      showbacktotop: false,
      showbacktoonefloor: false,
      showbookmarkbtn: false,
      showbookmarkfolderbtn: false,
      showviewhistorylist: false,
      settingsSearchQuery: "", // 添加搜索查询字段
      observer: null,
      dataLoaded: false, // 数据加载完成标志

      isMenuOpen: false,
    };
  },
  methods: {
    // 启用新 UI：右下角按钮收缩
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    handleKeyDown(e) {
      if (e.altKey && e.key === "-") {
        e.preventDefault();
        e.stopPropagation();

        const el = e.target;
        const start = el.selectionStart;
        const end = el.selectionEnd;

        // 获取当前值
        const currentValue = el.value;
        // 创建新值
        const newValue =
          currentValue.substring(0, start) + "-" + currentValue.substring(end);

        // 手动修改输入框的值
        el.value = newValue;

        // 触发 input 事件来更新 v-model 绑定的数据
        el.dispatchEvent(new Event("input", { bubbles: true }));

        // 设置光标位置
        this.$nextTick(() => {
          el.selectionStart = el.selectionEnd = start + 1;
        });
      }
    },
    // 提示组件
    messageToast(message) {
      const messageElement = document.createElement("div");
      messageElement.className = "messageToast-text";
      messageElement.innerText = message;
      document.getElementById("messageToast").appendChild(messageElement);
      setTimeout(() => {
        messageElement.remove();
      }, 3000);
    },
    // 打开设置
    setting() {
      this.showdialog = true;
      this.opacity = true;
    },
    // 关闭弹窗
    closedialog() {
      this.showdialog = false;
      this.opacity = false;
    },
    // 保存设置
    async save() {
      try {
        const success = await settingsManager.saveSettings(this.settingData);
        if (success) {
          this.messageToast("保存成功！");
          this.showdialog = false;
          this.opacity = false;
        } else {
          this.messageToast("保存失敗，請檢查控制台獲取詳細信息");
        }
      } catch (error) {
        console.error('保存設置失敗：', error);
        if (error.name === 'DataCloneError') {
          this.messageToast("數據格式錯誤，請檢查設置內容");
        } else {
          this.messageToast("保存失敗，請重試！");
        }
      }
    },
    // 保存并刷新
    saveload() {
      this.save();
      location.reload();
    },

    showItem(index) {
      // 更新激活索引
      this.activeIndex = index;
    },
    // 初始化设置
    async initialization() {
      try {
        await settingsManager.clearSettings();
        this.messageToast("初始化设置成功，即将自动刷新！");
        setTimeout(() => {
          location.reload();
        }, 1000);
      } catch (error) {
        console.error('初始化設置失敗：', error);
        this.messageToast("初始化失敗，請重試！");
      }
    },
    // 搜索设置项
    matchesSearch(settingName) {
      if (!this.settingsSearchQuery) return true;

      const query = this.settingsSearchQuery.toLowerCase();
      return settingName.toLowerCase().includes(query);
    },
    initObserver() {
      const observer = new MutationObserver(() => {
        // 按钮插入逻辑
        if ($(".topic-map__contents").length > 0 && $(".linuxdoscripts-btn").length < 1) {
          $(".topic-map__contents").before(`<div class="linuxdoscripts-btn"></div>`);
        }

        // 按钮显隐逻辑
        if (this.showreplybtn) {
          if (window.location.href.includes("/topic/")) {
            $(".replaybtn").show();
            $(".lookopbtn").show();
          } else {
            $(".replaybtn").hide();
            $(".lookopbtn").hide();
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.observer = observer;
    },
  },
  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  async created() {
    this.initObserver();
    const browserAPI = typeof browser !== "undefined" ? browser : chrome;
    $("body").append('<div id="messageToast"></div>');
    console.log(
      `%c LinuxDo Scripts 扩展 v${packageJson.version} %c 已开启 `,
      "padding: 2px 1px; color: #fff; background: #606060;",
      "padding: 2px 1px; color: #fff; background: #42c02e;"
    );


    // 使用 IndexedDB 加载设置数据
    try {
      const existingData = await settingsManager.getSettings();

      if (existingData) {
        function deepMerge(target, source) {
          for (const key in source) {
            if (source[key] instanceof Object && key in target) {
              target[key] = deepMerge(target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
          return target;
        }
        
        this.settingData = deepMerge(this.settingData, existingData);
        await settingsManager.saveSettings(this.settingData);

        this.showlookop = this.settingData.checked9;
        this.showlevelsearch = this.settingData.checked12;
        this.showreplybtn = this.settingData.checked25;
        this.showbacktotop = this.settingData.checked34;
        this.showbacktoonefloor = this.settingData.checked48;
        this.showbookmarkbtn = this.settingData.checked52;
        this.showbookmarkfolderbtn = this.settingData.checked53;
        this.showviewhistorylist = this.settingData.checked56;
        this.controlheight = this.settingData.checked01;
        
      } else {
        // 如果没有现有数据，保存默认设置
        await settingsManager.saveSettings(this.settingData);
      }
      
      // 数据加载完成，可以渲染组件了
      this.dataLoaded = true;
    } catch (error) {
      console.error('加載設置數據失敗:', error);
      // 如果 IndexedDB 失敗，可以考慮回退到 localStorage 作為備用
      this.messageToast("加載設置失敗，使用默認設置");
      // 即使加载失败也要显示界面
      this.dataLoaded = true;
    }

    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "getData") {
        browserAPI.storage.local.get(["transferData"], (result) => {
          if (result.transferData) {
            // 处理收到的设置数据
            localStorage.setItem(
              "isShowSettingConfig",
              result.transferData.isShowSettingConfig
            );

            // 处理完成后删除数据
            browserAPI.storage.local.remove("transferData");
          }
        });
      }
    });

    // 判断是否设置隐藏按钮
    const isShowSettingConfig = localStorage.getItem("isShowSettingConfig");

    if (isShowSettingConfig) {
      this.isShow = JSON.parse(isShowSettingConfig);
    }

    $("head").append(
      `<style>.linuxdoscripts-setting-wrap{position:fixed;left:0;bottom:0;width:60px;height:100vh;z-index:9;display:flex;flex-direction:column;justify-content:flex-end;padding:10px;box-sizing:border-box}.linuxdoscripts-setting-wrap>button{opacity:0;margin-left:-50px;transition:all .2s linear}.linuxdoscripts-setting-wrap:hover>button{opacity:1;margin-left:0}@media (max-width:768px){.linuxdoscripts-setting-wrap{height:auto;position:fixed}.linuxdoscripts-setting-wrap>button{opacity:1;margin-left:0}}.linuxdoscripts-setting{display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;outline:0;background:#000;color:#fff;width:40px;height:40px;border-radius:5px;box-shadow:1px 2px 5px rgba(0,0,0,.6)}.timeline-container .topic-timeline .timeline-scrollarea{max-width:100px!important}#linuxdoscripts{font-size:14px}#linuxdoscripts input[type=text]{width:100%;background:var(--d-input-bg-color)}#linuxdoscripts input[disabled]{background:#fafafa;color:#666}#linuxdoscripts input[type=checkbox]{width:auto;transform:scale(1.2)}#linuxdoscripts input[type=radio]{width:auto}#linuxdoscripts img{vertical-align:bottom;max-width:100%;height:auto}#linuxdoscripts .close{position:absolute;right:10px;top:45%;cursor:pointer;font-size:34px;color:#999;transform:translateY(-50%) rotate(45deg)}#linuxdoscripts .setting-btn{z-index:199;position:fixed;bottom:20px;right:20px}#linuxdoscripts .setting-btn .el-button{width:50px;height:50px;border-radius:50%;position:relative;display:inline-flex;align-items:center;justify-content:center;padding:0;margin:0;margin-top:10px;font-size:13px;font-weight:500;color:var(--secondary);background:linear-gradient(135deg,var(--primary) 0,var(--primary-medium) 100%);border:none;cursor:pointer;transition:all .3s cubic-bezier(.4, 0, .2, 1);box-shadow:0 4px 15px rgba(var(--primary-rgb),.2);overflow:hidden}#linuxdoscripts .setting-btn .el-button::before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,rgba(255,255,255,.1) 0,rgba(255,255,255,0) 100%);opacity:0;transition:opacity .3s ease}#linuxdoscripts .setting-btn .el-button:hover{box-shadow:0 6px 20px rgba(var(--primary-rgb),.3)}#linuxdoscripts .setting-btn .el-button:hover::before{opacity:1}#linuxdoscripts .setting-btn .el-button:active{box-shadow:0 2px 10px rgba(var(--primary-rgb),.2)}#linuxdoscripts .setting-btn .el-button svg{margin:0}#linuxdoscripts .setting-btn .el-button span{position:relative;z-index:1}#linuxdoscripts .hint{margin-top:5px;color:#d94f4f;font-size:14px}#linuxdoscripts dialog{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;max-width:100vw;background:var(--header_background);color:var(--primary);box-shadow:0 8px 32px rgba(0,0,0,.1);border-radius:16px;padding:15px;z-index:99999;overflow-x:hidden;box-sizing:border-box;margin:0;border:none;outline:0}#linuxdoscripts dialog .menu-about{padding:5px 0;line-height:2}#linuxdoscripts dialog .menu-about .initialization{color:#999;border-bottom:1px dashed #999;cursor:pointer}#linuxdoscripts dialog .menu-about .initialization:hover{color:#333;border-color:#333}#linuxdoscripts dialog p{margin:0;font-size:14px}#linuxdoscripts .menu-header{padding:.5rem .5rem 1rem;border-bottom:1px solid #eee;position:relative}#linuxdoscripts .title{font-size:18px;font-weight:600;display:flex;align-items:center}#linuxdoscripts .title img{margin-left:10px}#linuxdoscripts button{padding:8px 16px;border-radius:4px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s ease;border:none;display:inline-flex;align-items:center;justify-content:center;background-color:var(--primary-low)}#linuxdoscripts button+button{margin-left:8px}#linuxdoscripts button.saveload{background:#000;color:#fff}#linuxdoscripts button:hover{opacity:.9}#linuxdoscripts .test-btn{background:#0084ff;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-top:10px}#linuxdoscripts .test-btn:hover{background:#0073e6}#linuxdoscripts .menu-flex{display:flex;justify-content:space-between;align-items:flex-start}#linuxdoscripts .menu-nav{width:140px;display:flex;flex-direction:column;padding:0;margin:0;padding-top:15px;margin-right:20px}#linuxdoscripts .menu-nav li{border-radius:4px;height:32px;width:100%;margin-bottom:5px;box-sizing:border-box;padding:0 10px;display:inline-flex;align-items:center;justify-content:flex-start;font-size:14px;cursor:pointer;line-height:1}#linuxdoscripts .menu-nav li svg{width:16px;margin-right:5px}#linuxdoscripts .menu-nav li.act{background:var(--d-selected)}#linuxdoscripts .menu-body{flex:1;height:480px;overflow-y:auto;box-sizing:border-box}#linuxdoscripts .menu-body::-webkit-scrollbar{height:8px;width:8px}#linuxdoscripts .menu-body::-webkit-scrollbar-corner{background:0 0}#linuxdoscripts .menu-body::-webkit-scrollbar-thumb{background:#dee0e1;border-radius:8px}#linuxdoscripts .menu-footer{display:flex;margin-top:10px;padding-top:6px}#linuxdoscripts .import{margin-left:auto!important}#linuxdoscripts .export,#linuxdoscripts .import{background:#d1f0ff;color:#559095}#linuxdoscripts .menu-body-item{padding-left:5px;padding-bottom:30px}#linuxdoscripts .menu-body-item .item{border-top:1px solid rgba(0,0,0,.05);padding:15px 0;display:flex;align-items:center;justify-content:space-between}#linuxdoscripts .menu-body-item .item .tit{height:100%;display:flex;align-items:center;flex-wrap:wrap;flex:1}#linuxdoscripts .menu-body-item .item input{margin-top:0;margin-bottom:0}#linuxdoscripts .menu-body-item .item select{margin-top:0;margin-bottom:0}#linuxdoscripts .menu-body-item .item input[type=checkbox]{width:30px;height:16px;position:relative;background-color:#dcdfe6;box-shadow:#dfdfdf 0 0 0 0 inset;border-radius:20px;background-clip:content-box;display:inline-block;appearance:none;-webkit-appearance:none;-moz-appearance:none;user-select:none;outline:0;padding:0;border:none}#linuxdoscripts .menu-body-item .item input[type=checkbox]::before{content:"";position:absolute;width:12px;height:12px;background-color:#fff;border-radius:50%;left:2px;top:0;bottom:0;margin:auto;transition:.3s}#linuxdoscripts .menu-body-item .item input[type=checkbox]:checked{background-color:var(--tertiary);transition:.6s}#linuxdoscripts .menu-body-item .item input[type=checkbox]:checked::before{left:14px;transition:.3s}#linuxdoscripts input{font-family:inherit;width:100%;border:1px solid #999;outline:0;padding:5px;font-size:14px;margin:0;resize:none;border-radius:0;color:var(--d-input-text-color);background:var(--d-input-bg-color)}#linuxdoscripts input:focus{border-color:var(--tertiary);outline:2px solid var(--tertiary);outline-offset:-2px}#linuxdoscripts textarea{font-family:inherit;width:100%;min-height:100px!important;border:1px solid #999;outline:0;padding:5px;font-size:14px;margin:0;resize:none;border-radius:0;color:var(--d-input-text-color);background:var(--d-input-bg-color)}#linuxdoscripts textarea:focus{border-color:var(--tertiary);outline:2px solid var(--tertiary);outline-offset:-2px}#linuxdoscripts .el-checkbox__inner{border:1px solid #979797}#linuxdoscripts label{margin:0}.linuxdoscripts-opacity{position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,.5);z-index:9999}.linuxlevel.four{background:linear-gradient(to right,red,#00f);-webkit-background-clip:text;color:transparent}.topic-post{position:relative}.linuxfloor{display:flex;color:var(--tertiary);width:30px;height:30px;align-items:center;justify-content:center;border-radius:6px;font-size:16px;border:0;background:0 0;outline:0;padding:0;margin-left:6px}.signature-p{color:#279a36;font-size:14px;word-break:break-word;text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.topic-list .views{font-weight:400!important;white-space:nowrap!important}.createreply{display:flex;flex-direction:column;max-width:300px}.createreply button{margin-bottom:10px;justify-content:flex-start;text-align:left;width:auto!important}.donottopic-btn,.removedonottopic-btn,.topicpreview-btn{height:30px!important;padding:4px 12px!important;font-size:14px!important;opacity:0!important;margin-right:5px!important}.topicpreview-btn.opacity1{opacity:1!important;width:25px;height:25px;padding:3px!important;vertical-align:sub}.topicpreview-btn.opacity1 svg{width:20px}.topicpreview-btn.opacity1+.topic-statuses{float:none}.topic-list-item:hover .donottopic-btn,.topic-list-item:hover .removedonottopic-btn,.topic-list-item:hover .topicpreview-btn{opacity:1!important}.topicpreview{position:fixed;top:0;left:0;z-index:99999;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;display:none}.topicpreview .topicpreview-container{padding:30px 0;border-radius:5px;width:100%;max-width:800px;overflow-y:auto;height:80vh;z-index:10;background:var(--header_background);position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}.topicpreview .topicpreview-container .topicpreview-title{font-size:22px;font-weight:600;padding:0 30px}.topicpreview .topicpreview-container .topicpreview-date{padding:0 30px;color:#666}.topicpreview .topicpreview-container .topicpreview-content>.item{display:flex;align-items:flex-start;padding:20px 30px}.topicpreview .topicpreview-container .topicpreview-content>.item .itemfloor{width:50px;text-align:left;font-size:16px;padding-top:15px;color:#25b4cf}.topicpreview .topicpreview-container .topicpreview-content>.item .itempost{flex:1;background:var(--tertiary-low);padding:15px 15px;border-radius:10px;font-size:15px;word-break:break-all}.topicpreview .topicpreview-container .topicpreview-content>.item .itempost pre code{max-width:620px}.topicpreview .topicpreview-container .topicpreview-content>.item .itempost img{max-width:100%;max-height:100%;height:auto}.topicpreview .topicpreview-container .topicpreview-content>.item .itempost .itemname{font-size:16px;color:#8f3a3a;display:flex;justify-content:space-between;align-items:center}.topicpreview .topicpreview-container .topicpreview-content>.item .itempost .itemname span{color:#9e9e9e;margin-left:20px}.topicpreview .topicpreview-container .topicpreview-content>.item .itempost .itemdate{color:#b9b9b9;font-size:16px;margin-left:auto}.topicpreview-opacity{position:absolute;top:0;left:0;width:100%;height:100%;opacity:1;background:rgba(0,0,0,.6);z-index:9}.body-preview .sidebar-wrapper{display:none!important}body.body-preview #main-outlet-wrapper{display:block!important;padding-left:50px!important}.body-preview .d-header-wrap{display:none!important}.body-preview .menu_suspendedball{display:none!important}.post-activity{white-space:nowrap;display:inline-block;width:100%;text-align:left}.d-header img{height:var(--d-logo-height);width:auto;max-width:100%;object-fit:contain}.aicreated-btn,.aireplay-btn{outline:0;border:none;background:var(--tertiary-low);display:inline-flex;align-items:center;justify-content:center;line-height:1;font-size:14px;padding:4px 10px;border-radius:3px;margin-bottom:10px;margin-right:10px}.aicreated-all-btn{outline:0;border:none;background:var(--tertiary-low);display:inline-flex;align-items:center;justify-content:center;line-height:1;font-size:14px;padding:4px 10px;border-radius:3px;margin-bottom:10px;margin-right:10px}.aicreated-btn{display:none}.gpt-summary-wrap{background:var(--tertiary-low);border-radius:5px;padding:10px;font-size:14px;margin:0 0 10px 0;line-height:1.6}.gpt-summary-wrap .airegenerate{display:none;margin-top:6px;outline:0;border:1px solid #eee;background:#ffe27d;color:#626262;padding:4px 10px;cursor:pointer;border-radius:3px}.gpt-summary-wrap table{width:100%;border-collapse:collapse}.gpt-summary-wrap table tbody,.gpt-summary-wrap table thead,.gpt-summary-wrap table tr{border:none}.gpt-summary-wrap table th{font-weight:700}.gpt-summary-wrap table td,.gpt-summary-wrap table th{border:1px solid var(--primary-medium);padding:4px 10px;color:var(--primary)}.aicreatenewtopictitle{margin-left:20px}.aicreatenewtopictitle:hover{text-decoration:underline;cursor:pointer}.aireply-popup{z-index:999999;position:fixed;top:10%;left:50%;transform:translateX(-50%);width:500px;padding:20px;background:var(--tertiary-low);color:#333;box-shadow:transparent 0 0 0 0,transparent 0 0 0 0,rgba(0,0,0,.1) 0 20px 25px -5px,rgba(0,0,0,.1) 0 8px 10px -6px;border-radius:10px;display:none}.aireply-popup .aireply-popup-text{width:100%;height:120px}.aireply-popup .aireply-popup-close{outline:0;min-width:80px;height:32px;border:none;background-color:var(--header_background);text-shadow:0 -1px 0 rgba(0,0,0,.12);box-shadow:0 2px 0 rgba(0,0,0,.045);border-radius:4px;padding:0 10px;box-sizing:border-box;transition:all .1s linear}#messageToast{z-index:9999999;position:fixed;left:50%;transform:translateX(-50%);top:10%;width:100%;display:flex;flex-direction:column;align-items:center}#messageToast .messageToast-text{background:#4caf50;color:#fff;border-radius:6px;width:auto;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;text-align:center;line-height:1;min-height:40px;min-width:240px;font-size:16px;padding:0 30px;box-sizing:border-box;margin-bottom:10px;opacity:0;animation:messageToast .2s forwards;padding:12px 24px;color:#fff;border-radius:4px;font-size:14px;z-index:9999;box-shadow:0 2px 5px rgba(0,0,0,.2)}@keyframes messageToast{0%{transform:translateY(10px);opacity:0}100%{transform:translateY(0);opacity:1}}.pangutext{cursor:pointer;margin-left:20px}.pangutext:hover{color:#279a36}.navigation-container.is-active{position:fixed;top:65px;background:var(--header_background);z-index:9;box-shadow:1px 3px 7px 0 rgba(0,0,0,.2);margin-left:-30px;padding-left:30px;border-radius:5px;padding-top:10px;padding-right:20px;min-width:1000px;width:auto}.topic-body.clearfix.highlighted{background-color:var(--tertiary-low)!important}.hotranking-container{position:fixed;right:100px;bottom:20px;background:#fff;box-shadow:1px 10px 20px rgba(0,0,0,.2);border-radius:10px;width:400px;min-height:380px;padding:20px;box-sizing:border-box;z-index:999}.hotranking-container .flex{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}.hotranking-container ol li,.hotranking-container ul li{padding:2px 0}.hotranking-container ol li a:hover,.hotranking-container ul li a:hover{text-decoration:underline}.menu-body{padding:0 15px 0 0}.inner{display:flex;align-items:center;margin-bottom:10px}.inner label{width:70px;font-weight:400}.inner input{flex:1;margin:0;max-width:300px}.linuxdoscripts-tag{align-items:center;justify-content:center;position:relative;min-width:36px;height:22px;line-height:20px;padding:0 8px;margin-left:8px;vertical-align:middle;color:rgba(255,255,255,.95);font-size:14px!important;font-weight:600;letter-spacing:.3px;text-shadow:0 1px 1px rgba(0,0,0,.15);background-color:#29a6a9;background-image:linear-gradient(135deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.05) 50%,rgba(0,0,0,.05) 51%,rgba(0,0,0,.1) 100%);border-radius:3px;border:1px solid rgba(0,0,0,.12);box-sizing:border-box;box-shadow:0 1px 2px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.15);transition:all .2s cubic-bezier(.25, .46, .45, .94);overflow:hidden;z-index:1}.menu-table{width:100%;border-collapse:collapse;margin-top:10px}.menu-table td,.menu-table th{padding:6px 10px;font-size:14px;border:1px solid #cfcfcf}.menu-table .span{cursor:pointer}.menu-table .span+.span{margin-left:10px}.emojiPicker{top:0;left:0!important;position:absolute;display:grid;grid-template-columns:repeat(12,1fr);gap:10px;height:100%;overflow:auto;background-color:rgba(0,0,0,.8);padding:10px;border-radius:5px;z-index:9;box-sizing:border-box}.emojiPicker img{cursor:pointer;width:30px;height:30px}.emojiPickerNeo{width:560px;top:0;left:0!important;position:absolute;display:flex;flex-wrap:wrap;gap:10px;height:100%;overflow:auto;background-color:rgba(0,0,0,.8);padding:10px;border-radius:5px;z-index:9}.emojiPickerNeo img{cursor:pointer;width:100px;aspect-ratio:4/5;object-fit:cover}.emoji-picker-button-neo{color:rgb(100.3,100.3,100.3)!important}.UsageTip{position:static;margin:0;font-size:14px;line-height:1.6;background:var(--d-sidebar-background);color:var(--primary-medium)}.UsageTip>div{margin:10px 0}.UsageTip button{padding:8px 10px;margin-bottom:10px;border:none;outline:0;border-radius:4px}.linuxtime img{margin-right:5px}.topic-list .topic-list-data.posters{width:146px!important}@media (max-width:1000px){#linuxdoscripts .setting-btn{bottom:50px}}.linuxdoscripts-btn{display:flex;align-items:center;justify-content:flex-end;width:100%}.linuxdoscripts-btn>*{margin-right:8px!important;font-size:15px!important}.linuxdoscripts-btn svg{width:1.5em!important;height:1.5em!important}.linuxdoscripts-btn>:last-child{margin-right:0!important}#linuxdoscripts .group-line{text-align:center;font-weight:600;font-size:15px;position:relative;display:flex;align-items:center;justify-content:center;white-space:nowrap;margin-top:20px}#linuxdoscripts .group-line::after,#linuxdoscripts .group-line::before{content:'';display:inline-block;width:1920px;height:1px;background:var(--primary-300)}#linuxdoscripts .group-line::before{margin-right:15px}#linuxdoscripts .group-line::after{margin-left:15px}#linuxdoscripts .group-line+.item{border:none}#linuxdoscripts .main-btn{width:50px;height:50px;border-radius:50%;background:var(--d-button-primary-bg-color);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.4, 0, .2, 1);box-shadow:0 4px 15px rgba(var(--primary-rgb),.2);position:fixed;right:20px;bottom:20px;font-weight:400;line-height:1}#linuxdoscripts .main-btn svg{color:#fff}#linuxdoscripts .main-btn:hover{transform:scale(1.1);background:var(--d-button-primary-bg-color)}#linuxdoscripts .main-btn.active{transform:rotate(45deg);background:var(--d-button-primary-bg-color--hover)}#linuxdoscripts .menu-items{bottom:80px!important;opacity:0;pointer-events:none;transition:all .3s cubic-bezier(.4, 0, .2, 1)}#linuxdoscripts .menu-items.active{opacity:1;pointer-events:all}#linuxdoscripts .menu-items>div{transition:all .3s ease;transform:scale(0) rotate(180deg)}#linuxdoscripts .menu-items.active>div{transform:scale(1) rotate(0)}#linuxdoscripts .menu-items.active>div:first-child{transition-delay:0.1s}#linuxdoscripts .menu-items.active>div:nth-child(2){transition-delay:0.15s}#linuxdoscripts .menu-items.active>div:nth-child(3){transition-delay:0.2s}#linuxdoscripts .menu-items.active>div:nth-child(4){transition-delay:0.25s}#linuxdoscripts .menu-items.active>div:nth-child(5){transition-delay:0.3s}#linuxdoscripts .menu-items.active>div:nth-child(6){transition-delay:0.35s}#linuxdoscripts .menu-items.active>div:nth-child(7){transition-delay:0.4s}#linuxdoscripts .menu-items.active>div:nth-child(8){transition-delay:0.45s}#linuxdoscripts .menu-items.active>div:nth-child(9){transition-delay:0.5s}#reply-control .discard{display:flex}#reply-control .discard .replyja{margin-right:10px}#reply-control .discard-button{margin-left:auto}#linuxDoLevelPopupContent table{border-collapse:collapse}#linuxDoLevelPopupContent table td{padding:4px 10px}#linuxDoLevelPopupContent table tr:nth-child(2n){background-color:#ddd;color:#333}#linuxDoLevelPopupContent .text-green-500{color:#10b981}#linuxDoLevelPopupContent .text-red-500{color:#ef4444}.ObsidianCalloutsPicke{width:560px;top:0;left:0!important;position:absolute;height:100%;overflow:auto;background-color:rgba(0,0,0,.8);padding:10px;border-radius:5px;z-index:9;box-sizing:border-box}.ObsidianCalloutsPicke>div{width:100%;margin-bottom:10px;cursor:pointer}.createreply-select{border:var(--d-button-default-border);border-radius:var(--d-button-border-radius);background-color:var(--d-button-default-bg-color);height:38px}.d-editor-preview-wrapper{position:relative}</style>`
    );
  },
};
</script>
