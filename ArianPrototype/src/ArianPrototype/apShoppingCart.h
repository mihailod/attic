//
//  apShoppingCart.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface apShoppingCart : UIViewController

- (IBAction) emptyCartAction;
- (IBAction) placeOrderAction;

@property (strong, nonatomic) IBOutlet UILabel *empty;

@property (strong, nonatomic) IBOutlet UITableView *tableViewCart;
@property (strong, nonatomic) IBOutlet UILabel *total;
@property (strong, nonatomic) IBOutlet UILabel *sum;
@property (strong, nonatomic) IBOutlet UIButton *placeOrder;
@property (strong, nonatomic) IBOutlet UIButton *emptyCart;

@property IBOutlet UIActivityIndicatorView *spinner;

@end
