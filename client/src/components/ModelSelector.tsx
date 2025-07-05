import { Fragment, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { modelsApi } from '../services/api';
import clsx from 'clsx';

export default function ModelSelector() {
  const { models, selectedModel, setModels, setSelectedModel } = useChatStore();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const availableModels = await modelsApi.getAll();
      setModels(availableModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <Listbox value={selectedModel} onChange={setSelectedModel}>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left border border-claude-border dark:border-claude-border-dark focus:outline-none focus:ring-2 focus:ring-claude-accent text-sm">
          <span className="block truncate">
            {currentModel?.name || 'Select Model'}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </span>
        </Listbox.Button>
        
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute right-0 mt-1 max-h-60 w-72 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
            {models.map((model) => (
              <Listbox.Option
                key={model.id}
                className={({ active }) =>
                  clsx(
                    'relative cursor-pointer select-none py-2 pl-10 pr-4',
                    active ? 'bg-claude-accent/10 text-claude-accent' : 'text-gray-900 dark:text-gray-100'
                  )
                }
                value={model.id}
              >
                {({ selected }) => (
                  <>
                    <span className={clsx('block', selected ? 'font-medium' : 'font-normal')}>
                      {model.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {model.description}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-claude-accent">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}