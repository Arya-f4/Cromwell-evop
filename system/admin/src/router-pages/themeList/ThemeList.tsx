import { TCCSVersion, TCmsSettings, TPackageCromwellConfig, TThemeEntity } from '@cromwell/core';
import { getGraphQLClient, getRestApiClient } from '@cromwell/core-frontend';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { themeMarketPageInfo } from '../../constants/PageInfos';
import { ThemePackage, ThemePackageSkeleton } from './components/ThemePackage';

const ThemeListing: React.FunctionComponent = () => {
  const [isLoading, setLoading] = useState(false);
  const [isChangingTheme, setChangingTheme] = useState(false);
  const [packages, setPackages] = useState<TPackageCromwellConfig[]>([]);
  const [installedThemes, setInstalledThemes] = useState<TThemeEntity[]>([]);
  const [cmsConfig, setCmsConfig] = useState<TCmsSettings>({});
  const [themeUpdates, setThemeUpdates] = useState<{
    [key: string]: TCCSVersion;
  }>({});
  const [isUpdating, setIsUpdating] = useState<{
    [key: string]: boolean;
  }>({});
  const [deleteModal, setDeleteModal] = useState(false);
  const pageRef = useRef();

  const fetchConfigAndPackages = useCallback(async () => {
    try {
      const client = getRestApiClient();
      const updatedConfig = await client?.getCmsSettings();
      setCmsConfig(updatedConfig);

      const infos = await client?.getThemesInfo();
      infos?.sort((a) => (updatedConfig && a.name === updatedConfig.themeName ? -1 : 1));

      if (infos) setPackages(infos);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getThemeList = async () => {
    await fetchConfigAndPackages();
    const graphQLClient = getGraphQLClient();
    if (graphQLClient) {
      try {
        const themeEntities: TThemeEntity[] = await graphQLClient.getAllEntities(
          'Theme',
          graphQLClient.ThemeFragment,
          'ThemeFragment',
        );
        if (themeEntities && Array.isArray(themeEntities)) {
          setInstalledThemes(themeEntities);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getThemeUpdates = async () => {
    for (const theme of packages) {
      themeUpdates[theme.name] = undefined;
      try {
        const update = await getRestApiClient().getThemeUpdate(theme.name);
        if (update) {
          themeUpdates[theme.name] = update;
        }
      } catch (error) {
        console.error(error);
      }
    }

    setThemeUpdates(themeUpdates);
  };

  const checkUpdates = async () => {
    if (pageRef?.current) {
      await getThemeList();
      await getThemeUpdates();
    }
  };

  const init = async () => {
    setLoading(true);
    console.log('INIT');
    await getThemeList();
    console.log('INIT DONE');
    setLoading(false);

    await getThemeUpdates();
  };

  useEffect(() => {
    init();
    const timer = setInterval(checkUpdates, 30000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4" ref={pageRef}>
      <Link to={themeMarketPageInfo.route}>
        <button className="bg-gradient-to-r rounded-xl my-auto mx-auto max-w-lg from-indigo-900 to-pink-800 text-white py-2 transform px-4 transition-all hover:to-pink-600">
          <div className="flex w-full justify-between">
            <PlusIcon className="h-5 fill-white mt-[2px] mr-2 w-5" />
            <div>
              <p className="text-md">Explore themestore</p>
            </div>
          </div>
        </button>
      </Link>
      <div className="flex flex-row gap-4">
        <div className="grid gap-4 grid-cols-1 relative">
          {isChangingTheme && (
            <div className="flex flex-row h-full w-full top-0 left-0 z-30 absolute backdrop-filter backdrop-blur-md items-center">
              <ArrowPathIcon className="bg-white rounded-full mx-auto h-16 p-2 animate-spin fill-indigo-600 w-16 self-center" />
            </div>
          )}
          {isLoading &&
            Array.from({ length: 3 })
              .fill('-')
              .map((v, i) => (
                <div key={i} className="grid gap-4 grid-cols-1-">
                  <ThemePackageSkeleton />
                </div>
              ))}
          {!isLoading && (
            <div className="grid gap-4 grid-cols-1">
              {packages.map((info) => {
                const isActive = Boolean(cmsConfig && cmsConfig.themeName === info.name);
                const entity = installedThemes?.find((ent) => ent.name === info.name);
                const isInstalled = entity?.isInstalled ?? false;
                const availableUpdate = themeUpdates[info.name];
                const isUnderUpdate = isUpdating[info.name];

                return (
                  <ThemePackage
                    key={info.name}
                    info={info}
                    isActive={isActive}
                    isInstalled={isInstalled}
                    availableUpdate={availableUpdate}
                    isUnderUpdate={isUnderUpdate}
                    setDeleteModal={setDeleteModal}
                    isChangingTheme={isChangingTheme}
                    setChangingTheme={setChangingTheme}
                    updateConfig={fetchConfigAndPackages}
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl h-auto max-w-xs shadow-md mt-2 max-h-[24rem] p-4 shadow-indigo-300 hidden lg:inline-block xl:max-w-md xl:max-h-[22rem] dark:bg-gray-900">
          <h2 className="font-bold my-3 text-2xl text-indigo-600">Did You Know?</h2>
          <hr />
          <p className="text-sm py-2">
            Cromwell CMS follows principles of headless CMS where API server runs separately from frontend server. So
            basically you can create any type of frontend and host it wherever you like. But in this scenario, you need
            to manage and deploy this frontend by yourself. To simply the workflow Cromwell CMS has its theming engine.
            Users can easily install Themes from the official market right in their Admin panel GUI, make active, delete
            them, change layout in the Theme Editor as long as Themes follow the guidelines we are going to show.
            <Link
              className="my-3 text-indigo-600 underline"
              to="https://cromwellcms.com/docs/development/theme-development"
              target="_blank"
            >
              Learn more about theme development.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeListing;
