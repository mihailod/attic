//
//  apProductDetailViewController.h
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "apData.h"

@interface apProductDetailViewController : UIViewController <UIPickerViewDataSource,UIPickerViewDelegate>

- (IBAction) addToCartAction;
- (IBAction) deliveryAction;
- (IBAction)stepperValueChanged;

@property NSObject *cartItemObject; // todo why this cannot be an apItemObject!?
@property BOOL updateCartItemMode;
@property BOOL alreadyPopulatedGuiFromCartItem;

@property IBOutlet UIButton *addToCart;
@property IBOutlet UITextView *descriptionTV;
@property IBOutlet UIActivityIndicatorView *spinner;
@property IBOutlet UIImageView *image;
@property IBOutlet UILabel *price;

@property IBOutlet UIPickerView *format;
@property IBOutlet UIImageView *formatPic;
@property IBOutlet UILabel *resolution;
@property IBOutlet UISegmentedControl *delivery;
@property IBOutlet UILabel *resolutionLabel;
@property IBOutlet UILabel *deliveryLabel;
@property IBOutlet UILabel *quantity;
@property IBOutlet UIStepper *quantityStepper;

@end
