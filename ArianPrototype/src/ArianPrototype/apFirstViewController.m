//
//  apFirstViewController.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/18/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apFirstViewController.h"
#import "ap2.h"

@interface apFirstViewController ()

@end

@implementation apFirstViewController

@synthesize searchResults;
@synthesize textField;

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
    
    [[self navigationItem] setTitle:@"Arian Products"];
    searchResults = [NSArray arrayWithObjects: @"Printed Products", @"Marketing Ads", @"Add-Ons", nil];
    
    self.tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table View

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return searchResults.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    //UITableViewCell *cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"Cell"];
    
    /*
     Found the answer looking at Apples example project "LazyTableImages"
     
     NSURL *url = [NSURL URLWithString: item.imgPath];
     UIImage *thumbnail = [UIImage imageWithData: [NSData dataWithContentsOfURL:url]];
     if (thumbnail == nil) {
     thumbnail = [UIImage imageNamed:@"noimage.png"] ;
     }
     CGSize itemSize = CGSizeMake(40, 40);
     UIGraphicsBeginImageContext(itemSize);
     CGRect imageRect = CGRectMake(0.0, 0.0, itemSize.width, itemSize.height);
     [thumbnail drawInRect:imageRect];
     cell.imageView.image = UIGraphicsGetImageFromCurrentImageContext();
     UIGraphicsEndImageContext();
     
     return cell;*/
    
    
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"Cell" forIndexPath:indexPath];
    cell = [cell initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"Cell"];
    cell.textLabel.text = searchResults[indexPath.row];
    
    if (indexPath.row == 0) {
        
        /*UIImage *thumbnail = [UIImage imageNamed:@"printedproducts"];
        CGSize itemSize = CGSizeMake(90, 90);
        UIGraphicsBeginImageContext(itemSize);
        CGRect imageRect = CGRectMake(0.0, 0.0, itemSize.width, itemSize.height);
        [thumbnail drawInRect:imageRect];
        cell.imageView.image = UIGraphicsGetImageFromCurrentImageContext();
        UIGraphicsEndImageContext();*/
        
        cell.imageView.image = [UIImage imageNamed:@"printedproducts"];
        cell.imageView.contentMode = UIViewContentModeScaleAspectFill;
        cell.detailTextLabel.text = @"Cards, Labels, Flyers...";
    } else if (indexPath.row == 1) {
        cell.imageView.image = [UIImage imageNamed:@"marketingads"];
        cell.imageView.contentMode = UIViewContentModeScaleAspectFill;
        cell.detailTextLabel.text = @"Flags, Posters, Signs...";
    } else {
        cell.imageView.image = [UIImage imageNamed:@"addons"];
        cell.imageView.contentMode = UIViewContentModeScaleAspectFill;
        cell.detailTextLabel.text = @"Bags, Stands, Trays...";
    }
    
    return cell;
}

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    if([[segue identifier] isEqualToString:@"ap2"]) {
        NSIndexPath *indexPath = [[self tableView] indexPathForSelectedRow];
        [[segue destinationViewController] setTitle:searchResults[indexPath.row]];
        [[segue destinationViewController] setSelectedProducts:indexPath.row];
    }
}

@end
