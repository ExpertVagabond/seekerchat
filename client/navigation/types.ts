export type RootStackParamList = {
  Auth: undefined;
  TokenGate: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  ChatsTab: undefined;
  ChannelsTab: undefined;
  SettingsTab: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { channelId: string; channelName: string };
  NewDM: undefined;
  Profile: { userId: string };
};

export type ChannelStackParamList = {
  ChannelBrowser: undefined;
  ChatRoom: { channelId: string; channelName: string };
};
