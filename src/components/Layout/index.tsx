import type { FC } from 'react';
import { App as AntdApp, Layout as AntLayout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageOutlined,
  SettingOutlined,
  ToolOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

const Layout: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/agent',
      icon: <MessageOutlined />,
      label: '智能体对话',
    },
    {
      key: '/model-config',
      icon: <SettingOutlined />,
      label: '模型配置',
    },
    {
      key: '/tools',
      icon: <ToolOutlined />,
      label: '工具管理',
      children: [
        { key: '/tools/providers', label: '工具供应商' },
        { key: '/tools/functions', label: '工具函数' },
      ],
    },
    {
      key: '/skills',
      icon: <ThunderboltOutlined />,
      label: 'Skill管理',
    },
  ];

  return (
    <AntdApp>
      <AntLayout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Mooc Manus</div>
        </Header>
        <AntLayout>
          <Sider width={200} theme="light">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              defaultOpenKeys={['/tools']}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
          <Content style={{ padding: '24px', background: '#f0f2f5' }}>
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>
    </AntdApp>
  );
};

export default Layout;
