import { Component, h, State, Element, Host, Prop } from '@stencil/core';

@Component({ tag: 'ticketable-list', shadow: false })
export class TicketableList {
  @State() items: any[] = [];
  @State() loading = true;

  @Prop() containerClass?: string;
  @Prop() filter?: string;

  componentWillLoad() {
    setTimeout(() => {
      this.items = [
        {
          title: 'Ticket 1',
          starts_at: '2021-01-01',
          ends_at: '2021-01-01',
          price: 100
        },
        {
          title: 'Ticket 2',
          starts_at: '2021-01-01',
          ends_at: '2021-01-01',
          price: 200
        }
      ];

      this.loading = false;
    }, 1000);
  }

  @Element() element: HTMLElement;

  render() {
    if(this.loading) {
      return <h1>Loading...</h1>
    }

    const template = this.element.querySelector('template') as HTMLTemplateElement | null;
    if(!template) {
      return <h1>No template found - fix config</h1>
    }

    const htmlParts = this.items.map((item) => {
      const fragment = template.content.cloneNode(true) as DocumentFragment;

      fragment.querySelectorAll('ticketable-value').forEach((valueEl) => {
        const key = valueEl.getAttribute('name');
        if(!key) return;
        const value = (item as any)[key];
        (valueEl as HTMLElement).textContent = value != null ? String(value) : '';
      });

      const wrapper = document.createElement('div');
      wrapper.appendChild(fragment);
      return wrapper.innerHTML;
    });

    return <Host>
      <div class={this.containerClass} innerHTML={htmlParts.join('')}></div>

      <slot name="pagination"></slot>
    </Host>
  }
}
