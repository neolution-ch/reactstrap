/* eslint react/no-find-dom-node: 0 */
// https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-find-dom-node.md

import React from 'react';
import PropTypes from 'prop-types';
import { Manager } from 'react-popper';
import classNames from 'classnames';
import { DropdownContext } from './DropdownContext';
import { mapToCssModules, omit, tagPropType } from './utils';
import { InputGroupContext } from './InputGroupContext';

const propTypes = {
  a11y: PropTypes.bool,
  disabled: PropTypes.bool,
  direction: PropTypes.oneOf(['up', 'down', 'start', 'end', 'left', 'right']),
  group: PropTypes.bool,
  isOpen: PropTypes.bool,
  nav: PropTypes.bool,
  active: PropTypes.bool,
  size: PropTypes.string,
  tag: tagPropType,
  toggle: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  cssModule: PropTypes.object,
  dropup: PropTypes.bool,
  inNavbar: PropTypes.bool,
  setActiveFromChild: PropTypes.bool,
  menuRole: PropTypes.oneOf(['listbox', 'menu']),
};

const defaultProps = {
  a11y: true,
  isOpen: false,
  direction: 'down',
  nav: false,
  active: false,
  inNavbar: false,
  setActiveFromChild: false,
};

const preventDefaultKeys = [
  ' ',
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'End',
  'Home',
];

// Normalize key string from legacy keyCode for backwards compatibility
// (fireEvent in tests may only set keyCode, while userEvent v14 only sets key)
const keyCodeToKey = {
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  32: ' ',
  35: 'End',
  36: 'Home',
  38: 'ArrowUp',
  40: 'ArrowDown',
  78: 'n',
  80: 'p',
};

function getKey(e) {
  if (e.key && e.key !== 'Unidentified') return e.key;
  const code = e.keyCode || e.which;
  if (code) {
    if (keyCodeToKey[code]) return keyCodeToKey[code];
    if (code >= 48 && code <= 90) return String.fromCharCode(code).toLowerCase();
  }
  return '';
}

class Dropdown extends React.Component {
  constructor(props) {
    super(props);

    this.addEvents = this.addEvents.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.removeEvents = this.removeEvents.bind(this);
    this.toggle = this.toggle.bind(this);
    this.handleMenuRef = this.handleMenuRef.bind(this);
    this.handleToggleRef = this.handleToggleRef.bind(this);

    this.containerRef = React.createRef();
    this.menuRef = React.createRef();
    this.toggleRef = React.createRef();
    // ref for DropdownToggle
  }

  componentDidMount() {
    this.handleProps();
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen !== prevProps.isOpen) {
      this.handleProps();
    }
  }

  componentWillUnmount() {
    this.removeEvents();
  }

  handleMenuRef(menuRef) {
    this.menuRef.current = menuRef;
  }

  handleToggleRef(toggleRef) {
    this.toggleRef.current = toggleRef;
  }

  handleDocumentClick(e) {
    if (
      e &&
      (e.button === 2 || (e.type === 'keyup' && getKey(e) !== 'Tab'))
    )
      return;
    const container = this.getContainer();
    const menu = this.getMenu();
    const toggle = this.getToggle();

    // Add a conditional check to avoid using toggle
    // if there is no toggle component in the dropdown
    if (!toggle) {
      return;
    }

    const targetIsToggle = toggle.contains(e.target);

    const clickIsInMenu = menu && menu.contains(e.target) && menu !== e.target;

    let clickIsInInput = false;
    if (container) {
      // This is only for InputGroup with type dropdown
      clickIsInInput =
        container.classList.contains('input-group') &&
        container.classList.contains('dropdown') &&
        e.target.tagName === 'INPUT';
    }

    if (
      ((targetIsToggle && !clickIsInInput) || clickIsInMenu) &&
      (e.type !== 'keyup' || getKey(e) === 'Tab')
    ) {
      return;
    }

    this.toggle(e);
  }

  handleKeyDown(e) {
    const isTargetMenuItem =
      e.target.getAttribute('role') === 'menuitem' ||
      e.target.getAttribute('role') === 'option';
    const isTargetMenuCtrl = this.getMenuCtrl() === e.target;
    const key = getKey(e);
    const isTab = key === 'Tab';

    if (
      /input|textarea/i.test(e.target.tagName) ||
      (isTab && !this.props.a11y) ||
      (isTab && !(isTargetMenuItem || isTargetMenuCtrl))
    ) {
      return;
    }

    if (
      preventDefaultKeys.indexOf(key) !== -1 ||
      (key.length === 1 && key.match(/[a-z0-9]/i))
    ) {
      e.preventDefault();
    }

    if (this.props.disabled) return;

    if (isTargetMenuCtrl) {
      if (
        [' ', 'Enter', 'ArrowUp', 'ArrowDown'].indexOf(key) > -1
      ) {
        // Open the menu (if not open) and focus the first menu item
        if (!this.props.isOpen) {
          this.toggle(e);
        }
        setTimeout(() => {
          const items = this.getMenuItems();
          items[0]?.focus();
        });
      } else if (this.props.isOpen && isTab) {
        // Focus the first menu item if tabbing from an open menu. We need this
        // for cases where the DropdownMenu sets a custom container, which may
        // not be the natural next item to tab to from the DropdownToggle.
        e.preventDefault();
        this.getMenuItems()[0]?.focus();
      } else if (this.props.isOpen && key === 'Escape') {
        this.toggle(e);
      }
    }

    if (this.props.isOpen && isTargetMenuItem) {
      if (['Tab', 'Escape'].indexOf(key) > -1) {
        this.toggle(e);
        this.getMenuCtrl().focus();
      } else if ([' ', 'Enter'].indexOf(key) > -1) {
        e.target.click();
        this.getMenuCtrl().focus();
      } else if (
        ['ArrowDown', 'ArrowUp'].indexOf(key) > -1 ||
        (['n', 'N', 'p', 'P'].indexOf(key) > -1 && e.ctrlKey)
      ) {
        const $menuitems = this.getMenuItems();
        let index = $menuitems.indexOf(e.target);
        if (key === 'ArrowUp' || (key.toLowerCase() === 'p' && e.ctrlKey)) {
          index = index !== 0 ? index - 1 : $menuitems.length - 1;
        } else if (
          key === 'ArrowDown' ||
          (key.toLowerCase() === 'n' && e.ctrlKey)
        ) {
          index = index === $menuitems.length - 1 ? 0 : index + 1;
        }
        $menuitems[index].focus();
      } else if (key === 'End') {
        const $menuitems = this.getMenuItems();
        $menuitems[$menuitems.length - 1].focus();
      } else if (key === 'Home') {
        const $menuitems = this.getMenuItems();
        $menuitems[0].focus();
      } else if (key.length === 1 && key.match(/[a-z0-9]/i)) {
        const $menuitems = this.getMenuItems();
        const charPressed = key.toLowerCase();
        for (let i = 0; i < $menuitems.length; i += 1) {
          const firstLetter =
            $menuitems[i].textContent &&
            $menuitems[i].textContent[0].toLowerCase();
          if (firstLetter === charPressed) {
            $menuitems[i].focus();
            break;
          }
        }
      }
    }
  }

  handleProps() {
    if (this.props.isOpen) {
      this.addEvents();
    } else {
      this.removeEvents();
    }
  }

  getContextValue() {
    return {
      toggle: this.toggle,
      isOpen: this.props.isOpen,
      direction:
        this.props.direction === 'down' && this.props.dropup
          ? 'up'
          : this.props.direction,
      inNavbar: this.props.inNavbar,
      disabled: this.props.disabled,
      // Callback that should be called by DropdownMenu to provide a ref to
      // a HTML tag that's used for the DropdownMenu
      onMenuRef: this.handleMenuRef,
      onToggleRef: this.handleToggleRef,
      menuRole: this.props.menuRole,
    };
  }

  getContainer() {
    return this.containerRef.current;
  }

  getMenu() {
    return this.menuRef.current;
  }

  getToggle() {
    return this.toggleRef.current;
  }

  getMenuCtrl() {
    if (this._$menuCtrl) return this._$menuCtrl;
    this._$menuCtrl = this.getToggle();
    return this._$menuCtrl;
  }

  getItemType() {
    if (this.props.menuRole === 'listbox') {
      return 'option';
    }
    return 'menuitem';
  }

  getMenuItems() {
    // In a real menu with a child DropdownMenu, `this.getMenu()` should never
    // be null, but it is sometimes null in tests. To mitigate that, we just
    // use `this.getContainer()` as the fallback `menuContainer`.
    const menuContainer = this.getMenu() || this.getContainer();
    return [].slice.call(
      menuContainer.querySelectorAll(`[role="${this.getItemType()}"]`),
    );
  }

  addEvents() {
    ['click', 'touchstart', 'keyup'].forEach((event) =>
      document.addEventListener(event, this.handleDocumentClick, true),
    );
  }

  removeEvents() {
    ['click', 'touchstart', 'keyup'].forEach((event) =>
      document.removeEventListener(event, this.handleDocumentClick, true),
    );
  }

  toggle(e) {
    if (this.props.disabled) {
      return e && e.preventDefault();
    }

    return this.props.toggle(e);
  }

  render() {
    const {
      className,
      cssModule,
      direction,
      isOpen,
      group,
      size,
      nav,
      setActiveFromChild,
      active,
      tag,
      menuRole,
      ...attrs
    } = omit(this.props, ['toggle', 'disabled', 'inNavbar', 'a11y']);

    const Tag = tag || (nav ? 'li' : 'div');

    let subItemIsActive = false;
    if (setActiveFromChild) {
      React.Children.map(
        this.props.children[1].props.children,
        (dropdownItem) => {
          if (dropdownItem && dropdownItem.props.active) subItemIsActive = true;
        },
      );
    }

    const classes = mapToCssModules(
      classNames(
        className,
        nav && active ? 'active' : false,
        setActiveFromChild && subItemIsActive ? 'active' : false,
        {
          'btn-group': group,
          [`btn-group-${size}`]: !!size,
          dropdown: !group,
          dropup: direction === 'up',
          dropstart: direction === 'start' || direction === 'left',
          dropend: direction === 'end' || direction === 'right',
          show: isOpen,
          'nav-item': nav,
        },
      ),
      cssModule,
    );

    if (this.context.insideInputGroup) {
      return (
        <DropdownContext.Provider value={this.getContextValue()}>
          <Manager>
            {React.Children.map(this.props.children, (child) =>
              React.cloneElement(child, { onKeyDown: this.handleKeyDown }),
            )}
          </Manager>
        </DropdownContext.Provider>
      );
    }

    return (
      <DropdownContext.Provider value={this.getContextValue()}>
        <Manager>
          <Tag
            {...attrs}
            {...{
              [typeof Tag === 'string' ? 'ref' : 'innerRef']: this.containerRef,
            }}
            onKeyDown={this.handleKeyDown}
            className={classes}
          />
        </Manager>
      </DropdownContext.Provider>
    );
  }
}

Dropdown.propTypes = propTypes;
Dropdown.defaultProps = defaultProps;
Dropdown.contextType = InputGroupContext;

export default Dropdown;
