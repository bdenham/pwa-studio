import { useEffect, useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import { useCartContext } from '@magento/peregrine/lib/context/cart';

/**
 * @ignore
 * 
 * Flattens query data into a simple object. We create this here rather than
 * having each line summary line component destructure its own data because
 * only the parent "price summary" component knows the data structure.
 *
 * @param {Object} data query data
 */
const flattenData = data => {
    if (!data) return {};
    /**
     * Query data flattened into a simple object.
     * 
     * @typedef {Object} FlattenedData
     * 
     * @property {String} subtotal Cart subtotal (excluding tax)
     * @property {String} total Cart grand total
     * @property {Array<Object>} discounts Discounts applied to the cart
     * @property {Array<Object>} giftCards Gift cards applied to the cart
     * @property {Array<Object>} taxes Taxes applied to the cart
     * @property {Array<Object>} shipping Shipping addresses associated with this cart
     */
    return {
        subtotal: data.cart.prices.subtotal_excluding_tax,
        total: data.cart.prices.grand_total,
        discounts: data.cart.prices.discounts,
        giftCards: data.cart.applied_gift_cards,
        taxes: data.cart.prices.applied_taxes,
        shipping: data.cart.shipping_addresses
    };
};

/**
 * This talon contains logic for a Price Summary component.
 * It performs effects and returns prop data for rendering the component.
 * 
 * @function
 * 
 * @param {Object} props 
 * @param {PriceSummaryQueries} props.queries GraphQL queries for Price Summary
 * 
 * @returns {PriceSummaryProps}
 */
export const usePriceSummary = props => {
    const {
        /**
         * GraphQL queries for Price Summary
         * 
         * @typedef {Object} PriceSummaryQueries
         * 
         * @property {GraphQLAST} getPriceSummary Query to get the price summary for a cart
         * 
         * @see [priceSummary.js]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceSummary/priceSummary.js}
         * for the queries used in Venia.
         */
        queries: { getPriceSummary }
    } = props;

    const [{ cartId }] = useCartContext();
    const history = useHistory();
    // We don't want to display "Estimated" or the "Proceed" button in checkout.
    const match = useRouteMatch('/checkout');
    const isCheckout = !!match;

    const { error, loading, data } = useQuery(getPriceSummary, {
        skip: !cartId,
        variables: {
            cartId
        }
    });

    useEffect(() => {
        if (error) {
            console.error('GraphQL Error:', error);
        }
    }, [error]);

    const handleProceedToCheckout = useCallback(() => {
        history.push('/checkout');
    }, [history]);

    /**
     * Props used for rendering a Price Summary component.
     * 
     * @typedef {Object} PriceSummaryProps
     * 
     * @property {Function} handleProceedToCheckout Callback function which navigates the browser to the checkout
     * @property {boolean} hasError True if a GraphQL query returns an error. False otherwise.
     * @property {boolean} hasItems True if the cart has any items. False otherwise.
     * @property {boolean} isLoading True while the GraphQL query is still in flight. False otherwise.
     * @property {FlattenedData} flatData Query data that has been flattened into a simple object
     * 
     */
    return {
        handleProceedToCheckout,
        hasError: !!error,
        hasItems: data && !!data.cart.items.length,
        isCheckout,
        isLoading: !!loading,
        flatData: flattenData(data)
    };
};
