import type { ConfigType } from '@plone/registry';

import installBlocks from './config/blocks';
import installReducers from './config/reducers';
import installRoutes from './config/routes';
import installSettings from './config/settings';
import installViews from './config/views';
import installWidgets from './config/widgets';

import { RecurrenceWidget } from '@plone/volto/components';



export function applyConfig(config: ConfigType) {
  installSettings(config);
  installBlocks(config);
  installReducers(config);
  installRoutes(config);
  installViews(config);
  installWidgets(config);
  config.widgets.id.recurrence = RecurrenceWidget;
  return config;
}

export default applyConfig;
