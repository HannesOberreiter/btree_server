import {
  createContainer,
  Lifetime,
  AwilixContainer,
  asClass,
  InjectionMode,
} from 'awilix';

import { Logger } from '@services/logger.service';
import { ProxyRouter } from '@services/proxy-router.service';
import { dirname } from 'path';
import { LoadedModuleDescriptor } from 'awilix/lib/load-modules';

export class Container {
  private static container: AwilixContainer;

  static capitalize = (s) => (s && s[0].toUpperCase() + s.slice(1)) || '';

  static nameController(
    _name: string,
    descriptor: LoadedModuleDescriptor
  ): string {
    return (descriptor.value as any).name; // get class name
  }

  private static init(): any {
    this.container = createContainer({
      injectionMode: InjectionMode.PROXY,
    });

    // Auto load and inject classes from controller folder
    this.container.loadModules(
      [`${dirname(__dirname)}/api/controllers/*.*.js`],
      {
        formatName: this.nameController,
        resolverOptions: {
          lifetime: Lifetime.SINGLETON,
          register: asClass,
        },
      }
    );

    this.container
      .register({
        Logger: asClass(Logger).singleton(),
      })
      .register({ ProxyRouter: asClass(ProxyRouter).singleton() });

    return this.container;
  }

  static resolve(instance: string) {
    if (!this.container) {
      return this.init().resolve(instance);
    }
    return this.container.resolve(instance);
  }
}
